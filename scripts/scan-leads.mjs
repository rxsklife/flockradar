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
      pubDate,
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

  let sent = 0;
  for (const i of fresh) {
    const [row] = await sql`
      insert into leads (url, title, summary, source_name, published_at, status)
      values (${i.link}, ${i.title}, null, ${i.source}, ${i.pubDate ? new Date(i.pubDate) : null}, 'pending')
      on conflict (url) do nothing
      returning id, url
    `;
    if (row) sent += 1;
  }

  console.log(`Inserted ${sent} pending leads; ${updates} known-entity mentions skipped (no Telegram alerts).`);
} finally {
  await sql.end();
}
