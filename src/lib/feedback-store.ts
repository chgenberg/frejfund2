import { promises as fs } from 'fs';
import path from 'path';

export interface FeedbackRecord {
  messageId: string;
  sessionId?: string;
  rating: 'up' | 'down';
  reason?: string;
  missing?: string;
  createdAt: number;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'feedback.json');

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(FILE_PATH).catch(async () => {
      await fs.writeFile(FILE_PATH, '[]', 'utf-8');
    });
  } catch {}
}

export async function appendFeedback(record: FeedbackRecord): Promise<void> {
  await ensureDataFile();
  const buf = await fs.readFile(FILE_PATH, 'utf-8');
  let arr: FeedbackRecord[] = [];
  try {
    arr = JSON.parse(buf) as FeedbackRecord[];
  } catch {
    arr = [];
  }
  arr.push(record);
  await fs.writeFile(FILE_PATH, JSON.stringify(arr, null, 2), 'utf-8');
}

export async function getFeedbackCount(): Promise<number> {
  await ensureDataFile();
  const buf = await fs.readFile(FILE_PATH, 'utf-8');
  try {
    const arr = JSON.parse(buf) as FeedbackRecord[];
    return arr.length;
  } catch {
    return 0;
  }
}
