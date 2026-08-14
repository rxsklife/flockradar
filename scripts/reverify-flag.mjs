#!/usr/bin/env node

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { max: 2 });

try {
  const stale = await sql`
    select name, state, last_verified_at
    from entities
    where last_verified_at is null
       or last_verified_at < now() - interval '180 days'
    order by last_verified_at asc nulls first
  `;

  const total = stale.length;
  const never = stale.filter((e) => !e.last_verified_at).length;

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log(`Telegram not configured; stale records: ${total} (${never} never verified)`);
    process.exit(0);
  }

  const lines = [
    `\u{1F504} RE-VERIFY CHECK \u2014 ${new Date().toISOString().slice(0, 10)}`,
    `\u{1F4C8} ${total} entity records due for re-verification (${never} never verified)`,
  ];
  if (total) {
    lines.push('');
    for (const e of stale.slice(0, 20)) {
      lines.push(
        `\u{2022} ${e.name}, ${e.state} \u2014 last verified: ${e.last_verified_at ? String(e.last_verified_at).slice(0, 10) : 'never'}`,
      );
    }
    if (total > 20) lines.push(`\u2026 and ${total - 20} more`);
  }
  lines.push('', 'Methodology target: re-verify every record within 6 months.');

  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: lines.join('\n') }),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error('sendMessage failed:', JSON.stringify(json));
    process.exit(1);
  }
  console.log(`Sent re-verify digest (${total} stale) to Telegram.`);
} finally {
  await sql.end();
}
