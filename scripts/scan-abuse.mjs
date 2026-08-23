#!/usr/bin/env node

import postgres from 'postgres';

const QUERY =
  '("Flock Safety" OR "license plate reader" OR ALPR OR "camera system") AND (abuse OR misuse OR stalker OR harassment OR "privacy violation" OR "unlawful use" OR misconduct)';
const RSS = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=en-US&gl=US&ceid=US:en`;

const ABUSE_INTENT = /abuse|misuse|stalk|harass|stalker|unlawful|misconduct|surveil|spy|spying/i;
const NOISE = /deals?|discount|sale\b|review|how.to|video game/i;

async function fetchItems() {
  const res = await fetch(RSS, { headers: { 'User-Agent': 'FlockRadar-abuse-scanner/0.1' } });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const grab = (tag) => {
      const t = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(block);
      return t ? t[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : null;
    };
    const title = grab('title');
    const link = grab('link');
    const pubDate = grab('pubDate');
    const source = grab('source');
    if (!title) continue;
    items.push({
      title: title.replace(/\s*-\s*[^-]+$/, ''),
      link,
      source: (source || '').replace(/<[^>]*>/g, ''),
      pubDate,
      ageHours: pubDate ? (Date.now() - Date.parse(pubDate)) / 3.6e6 : null,
    });
  }
  return items;
}

const sql = postgres(process.env.DATABASE_URL, { max: 2 });

try {
  const items = (await fetchItems())
    .filter((i) => i.ageHours !== null && i.ageHours <= 24 * 7)
    .filter((i) => ABUSE_INTENT.test(i.title) && !NOISE.test(i.title));

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured; would insert:', items.length, 'abuse reports');
    console.log(items.slice(0, 8).map((i) => `- ${i.title}`).join('\n'));
    process.exit(0);
  }

  let sent = 0;
  for (const i of items) {
    const [row] = await sql`
      insert into abuse_cases (url, title, summary, source_name, published_at, status)
      values (${i.link}, ${i.title}, null, ${i.source}, ${i.pubDate ? new Date(i.pubDate) : null}, 'pending')
      on conflict (url) do nothing
      returning id, url
    `;
    if (!row) continue;
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: [
          `\u26A0\uFE0F NEW ABUSE CASE ${row.id.slice(0, 4).toUpperCase()}`,
          `\u{1F3E2} ${i.title}`,
          i.source ? `\u{1F4CE} ${i.source}` : null,
          `\u{1F517} ${i.link}`,
        ].filter(Boolean).join('\n'),
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '\u2705 Approve', callback_data: `approve:abuse:${row.id}` },
              { text: '\u274C Deny', callback_data: `deny:abuse:${row.id}` },
            ],
          ],
        },
      }),
    });
    const json = await res.json();
    if (json.ok) sent += 1;
    else console.error('sendMessage failed:', JSON.stringify(json));
  }

  console.log(`Inserted ${sent} pending abuse reports.`);
} finally {
  await sql.end();
}
