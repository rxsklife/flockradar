#!/usr/bin/env node

import postgres from 'postgres';

const QUERY =
  '("Flock Safety" OR "license plate reader" OR ALPR) AND (council OR approved OR contract OR ballot OR vote OR install OR adopt OR authorize OR ordinance)';
const RSS = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=en-US&gl=US&ceid=US:en`;

const NEW_INTENT = /council|approv|contract|ballot|vote|install|adopt|authoriz|ordinance|grant|launch|deploy/i;
const NOISE = /vandal|vandalized|wanted|arrest|stalk|lawsuits?\b/i;

async function fetchItems() {
  const res = await fetch(RSS, { headers: { 'User-Agent': 'FlockRadar-lead-scanner/0.1' } });
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
      ageHours: pubDate ? (Date.now() - Date.parse(pubDate)) / 3.6e6 : null,
    });
  }
  return items;
}

const sql = postgres(process.env.DATABASE_URL, { max: 2 });

try {
  const items = (await fetchItems())
    .filter((i) => i.ageHours !== null && i.ageHours <= 48)
    .filter((i) => NEW_INTENT.test(i.title) && !NOISE.test(i.title));

  const existing = await sql`select name, city, state from entities`;
  const known = new Set(
    existing.flatMap((e) => [e.name.toLowerCase(), `${e.city ?? ''} ${e.state ?? ''}`.trim().toLowerCase()].filter(Boolean)),
  );

  const fresh = items.filter((i) => {
    const t = i.title.toLowerCase();
    return ![...known].some((k) => k.length > 4 && t.includes(k));
  });
  const updates = items.length - fresh.length;

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured; would send:', fresh.length, 'leads,', updates, 'known-entity mentions');
    console.log(fresh.slice(0, 8).map((i) => `- ${i.title}`).join('\n'));
    process.exit(0);
  }

  const lines = [
    `\u{1F50D} DAILY LEADS \u2014 ${new Date().toISOString().slice(0, 10)}`,
    `\u{1F4CC} ${fresh.length} potential new deployments, ${updates} mentions of mapped entities`,
  ];
  if (fresh.length) {
    lines.push('');
    for (const i of fresh.slice(0, 8)) {
      lines.push(`\u{2022} ${i.title}`);
      if (i.source) lines.push(`  via ${i.source}${i.ageHours !== null ? ` \u00B7 ${Math.round(i.ageHours)}h` : ''}`);
      if (i.link) lines.push(`  ${i.link}`);
    }
    if (fresh.length > 8) lines.push(`\u2026 and ${fresh.length - 8} more`);
  }
  lines.push('', 'No lead is published automatically. Review then add via the map pipeline.');

  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      disable_web_page_preview: true,
    }),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error('sendMessage failed:', JSON.stringify(json));
    process.exit(1);
  }
  console.log(`Sent ${fresh.length} leads + ${updates} updates to Telegram.`);
} finally {
  await sql.end();
}
