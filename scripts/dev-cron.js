#!/usr/bin/env node
const cron = require('node-cron');
const fetch = require('node-fetch');

const ENDPOINT = process.env.EMAIL_SYNC_ENDPOINT || 'http://localhost:3000/api/email/sync';
const SESSION_ID = process.env.DEMO_SESSION_ID || 'demo-session';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function runOnce() {
  try {
    const url = `${ENDPOINT}?sessionId=${encodeURIComponent(SESSION_ID)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(CRON_SECRET ? { authorization: `Bearer ${CRON_SECRET}` } : {})
      },
      body: JSON.stringify({ sessionId: SESSION_ID })
    });
    const json = await res.json().catch(() => ({}));
    const ok = res.ok;
    console.log(`[dev-cron] ${new Date().toISOString()} status=${res.status} ok=${ok} result=${JSON.stringify(json)}`);
  } catch (e) {
    console.error('[dev-cron] error', e);
  }
}

// Run immediately, then every 30 minutes
runOnce();
cron.schedule('*/30 * * * *', runOnce);


