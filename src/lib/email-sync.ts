import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { simpleParser, ParsedMail } from 'mailparser';
import { extractMany } from '@/lib/file-extractor';
import { indexContextForSession } from '@/lib/vector-store';
import { getDb } from '@/lib/db';

type GmailClient = gmail_v1.Gmail;

export interface EmailSyncResult {
  provider: 'gmail' | 'imap' | 'none';
  indexedEmails: number;
  indexedChunks: number;
  newHistoryId?: string;
}

interface SyncOptions {
  tenantId?: string;
  lookbackDays?: number;
}

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function hasGmailEnv(): boolean {
  return Boolean(
    getEnv('GOOGLE_CLIENT_ID') &&
    getEnv('GOOGLE_CLIENT_SECRET') &&
    getEnv('GMAIL_REFRESH_TOKEN') &&
    getEnv('GMAIL_EMAIL')
  );
}

async function getGmailClient(): Promise<GmailClient> {
  const clientId = getEnv('GOOGLE_CLIENT_ID')!;
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET')!;
  const refreshToken = getEnv('GMAIL_REFRESH_TOKEN')!;
  const oAuth2Client = new OAuth2Client(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

async function getLargestHistoryId(gmail: GmailClient, userId: string): Promise<string | undefined> {
  try {
    const prof = await gmail.users.getProfile({ userId });
    const hid = (prof.data as any).historyId || (prof.data as any).historyId?.toString?.();
    return hid ? String(hid) : undefined;
  } catch {
    return undefined;
  }
}

function base64UrlToBuffer(data: string): Buffer {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

async function parseEmailRaw(rawB64Url: string): Promise<ParsedMail> {
  const buf = base64UrlToBuffer(rawB64Url);
  const parsed = await simpleParser(buf);
  return parsed;
}

async function ensureStateTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS email_sync_state (
      session_id text PRIMARY KEY,
      provider text,
      history_id text,
      updated_at bigint
    );
  `);
}

async function loadHistoryId(sessionId: string): Promise<{ provider?: string; historyId?: string } | null> {
  const db = getDb();
  await ensureStateTable();
  const res = await db.query('SELECT provider, history_id FROM email_sync_state WHERE session_id = $1', [sessionId]);
  if (res.rows?.length) {
    return { provider: res.rows[0].provider || undefined, historyId: res.rows[0].history_id || undefined };
  }
  return null;
}

async function saveHistoryId(sessionId: string, provider: string, historyId: string | undefined) {
  const db = getDb();
  await ensureStateTable();
  const now = Date.now();
  if (historyId) {
    await db.query(
      `INSERT INTO email_sync_state (session_id, provider, history_id, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id) DO UPDATE SET provider = EXCLUDED.provider, history_id = EXCLUDED.history_id, updated_at = EXCLUDED.updated_at`,
      [sessionId, provider, historyId, now]
    );
  } else {
    await db.query(
      `INSERT INTO email_sync_state (session_id, provider, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id) DO UPDATE SET provider = EXCLUDED.provider, updated_at = EXCLUDED.updated_at`,
      [sessionId, provider, now]
    );
  }
}

async function indexEmailIntoSession(sessionId: string, parsed: ParsedMail): Promise<number> {
  const lines: string[] = [];
  const subject = parsed.subject || '';
  const from = parsed.from?.text || '';
  const to = parsed.to ? (typeof parsed.to === 'string' ? parsed.to : (parsed.to as any).text || '') : '';
  const date = parsed.date ? new Date(parsed.date).toISOString() : '';
  const bodyText = parsed.text || (parsed.html ? stripHtml(parsed.html) : '') || '';
  if (subject) lines.push(`Subject: ${subject}`);
  if (from) lines.push(`From: ${from}`);
  if (to) lines.push(`To: ${to}`);
  if (date) lines.push(`Date: ${date}`);
  if (bodyText) lines.push(`Body:\n${bodyText}`);

  // Parse attachments to extracted text
  try {
    const files: Array<{ name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> }> = [];
    for (const att of parsed.attachments || []) {
      if (!att.content || !att.filename) continue;
      const type = att.contentType || 'application/octet-stream';
      const buf: Buffer = Buffer.isBuffer(att.content) ? (att.content as Buffer) : Buffer.from(att.content as any);
      files.push({
        name: att.filename,
        type,
        arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
      });
    }
    if (files.length) {
      const docs = await extractMany(files as unknown as File[]);
      const attText = docs.map((d) => `Attachment: ${d.filename}\n${d.text || ''}`).join('\n\n');
      if (attText) lines.push(attText);
    }
  } catch {}

  const text = lines.join('\n');
  if (!text) return 0;
  return indexContextForSession(sessionId, text.slice(0, 200_000), { url: subject ? `email:${subject}` : 'email' });
}

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function gmailDeltaSync(sessionId: string, options?: SyncOptions): Promise<EmailSyncResult> {
  const gmail = await getGmailClient();
  const userId = getEnv('GMAIL_EMAIL')!;
  const lookbackDays = Math.max(1, Math.min(30, Math.floor(options?.lookbackDays || 1)));

  // Determine baseline historyId
  const state = await loadHistoryId(sessionId);
  let sinceHistoryId = state?.historyId;

  let messageIds: string[] = [];
  let newHistoryId: string | undefined;

  if (sinceHistoryId) {
    // Use History API to get new/changed messages
    let pageToken: string | undefined;
    do {
      const resp = await gmail.users.history.list({ userId, startHistoryId: sinceHistoryId, pageToken, historyTypes: ['messageAdded'] as any });
      const history = resp.data.history || [];
      for (const h of history) {
        const added = (h.messagesAdded || []).map((m) => m.message?.id).filter(Boolean) as string[];
        if (added.length) messageIds.push(...added);
      }
      pageToken = resp.data.nextPageToken || undefined;
      // Track the largest seen historyId from this page
      const pageMax = history.reduce((acc: number, h: any) => Math.max(acc, Number(h.id || h.historyId || 0)), 0);
      if (pageMax) newHistoryId = String(pageMax);
    } while (pageToken);
  }

  // If no historyId or no deltas, fall back to listing recent messages
  if (!sinceHistoryId || messageIds.length === 0) {
    const q = `newer_than:${lookbackDays}d`;
    let pageToken: string | undefined;
    do {
      const resp = await gmail.users.messages.list({ userId, q, maxResults: 100, pageToken });
      const msgs = resp.data.messages || [];
      messageIds.push(...msgs.map((m) => m.id!).filter(Boolean));
      pageToken = resp.data.nextPageToken || undefined;
    } while (pageToken);
  }

  // Fetch and index
  const uniqueIds = Array.from(new Set(messageIds)).slice(0, 500);
  let indexedEmails = 0;
  let indexedChunks = 0;

  for (const id of uniqueIds) {
    try {
      const m = await gmail.users.messages.get({ userId, id, format: 'raw' });
      const raw = (m.data as any).raw as string | undefined;
      if (!raw) continue;
      const parsed = await parseEmailRaw(raw);
      const chunks = await indexEmailIntoSession(sessionId, parsed);
      if (chunks > 0) {
        indexedEmails += 1;
        indexedChunks += chunks;
      }
    } catch {}
  }

  // Compute new baseline historyId
  try {
    const latest = await getLargestHistoryId(gmail, userId);
    if (latest) newHistoryId = latest;
  } catch {}

  if (newHistoryId) await saveHistoryId(sessionId, 'gmail', newHistoryId);

  return { provider: 'gmail', indexedEmails, indexedChunks, newHistoryId };
}

async function imapFallbackSync(_sessionId: string): Promise<EmailSyncResult> {
  // Placeholder: IMAP fallback requires imap client dependency not included in package.json
  return { provider: 'imap', indexedEmails: 0, indexedChunks: 0 };
}

export async function syncEmailsForSession(sessionId: string, options?: SyncOptions): Promise<EmailSyncResult> {
  if (!sessionId || typeof sessionId !== 'string') throw new Error('sessionId required');
  if (hasGmailEnv()) {
    return gmailDeltaSync(sessionId, options);
  }
  return imapFallbackSync(sessionId);
}


