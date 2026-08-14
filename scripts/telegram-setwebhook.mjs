#!/usr/bin/env node

const url = process.argv[2];

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set');
  process.exit(1);
}
if (url && !/^https:\/\//.test(url)) {
  console.error('Webhook URL must be https (Telegram requirement):', url);
  process.exit(1);
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const method = url ? 'setWebhook' : 'deleteWebhook';
const payload = url
  ? {
      url,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    }
  : { drop_pending_updates: true };

const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const json = await res.json();
console.log(method, '->', res.status, JSON.stringify(json));
if (!json.ok) process.exit(1);
