#!/usr/bin/env node
const REQUIRED = ['DATABASE_URL', 'OPENAI_API_KEY', 'NEXT_PUBLIC_APP_URL'];

let ok = true;
for (const key of REQUIRED) {
  if (!process.env[key]) {
    console.error(`[env] Missing ${key}`);
    ok = false;
  }
}
if (!ok) {
  process.exit(1);
}
console.log('[env] All required variables are present');
