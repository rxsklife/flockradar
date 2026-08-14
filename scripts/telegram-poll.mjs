#!/usr/bin/env node

const baseUrl = process.argv[2] || 'http://127.0.0.1:3000';
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}
if (!secret) {
  console.error('TELEGRAM_WEBHOOK_SECRET is not set (required by the webhook route)');
  process.exit(1);
}

const api = `https://api.telegram.org/bot${token}`;
let offset = 0;

async function call(method, payload = {}) {
  const res = await fetch(`${api}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const del = await call('deleteWebhook', { drop_pending_updates: true });
console.log('deleteWebhook ->', del.ok ? 'ok' : JSON.stringify(del));
console.log(`Polling ${baseUrl}/api/telegram/webhook ... Ctrl+C to stop`);

while (true) {
  let updates;
  try {
    updates = await call('getUpdates', { offset, timeout: 25 });
  } catch (err) {
    console.error('getUpdates failed:', err.message);
    await new Promise((r) => setTimeout(r, 3000));
    continue;
  }
  if (!updates.ok) {
    console.error('getUpdates error:', JSON.stringify(updates));
    await new Promise((r) => setTimeout(r, 3000));
    continue;
  }
  for (const u of updates.result ?? []) {
    offset = u.update_id + 1;
    try {
      const res = await fetch(`${baseUrl}/api/telegram/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-bot-api-secret-token': secret,
        },
        body: JSON.stringify(u),
      });
      const body = await res.text();
      if (!res.ok) console.error(`forward update ${u.update_id} -> ${res.status}: ${body}`);
      else console.log(`forward update ${u.update_id} (${u.callback_query ? 'callback' : u.message?.text || 'message'}) -> ok`);
    } catch (err) {
      console.error(`forward update ${u.update_id} failed:`, err.message);
    }
  }
}
