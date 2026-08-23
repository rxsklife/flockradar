#!/usr/bin/env node

import postgres from 'postgres';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('sslmode=require') ? 'require' : false,
});

const ACCEPTED = new Set(['city', 'town', 'village', 'municipality', 'county']);

async function geocode(title) {
  const words = title.split(/\s+/);
  for (let n = Math.min(6, words.length); n >= 1; n--) {
    const q = words.slice(0, n).join(' ');
    try {
      const r = await fetch(
        `https://photon.komoot.io/api/?limit=1&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': 'FlockRadarBot/0.1 (community location ingest)' } }
      );
      if (!r.ok) continue;
      const j = await r.json();
      const f = j?.features?.[0];
      if (!f) continue;
      const p = f.properties;
      if (p.country !== 'United States' || !ACCEPTED.has(p.osm_value)) continue;
      const [lon, lat] = f.geometry.coordinates;
      return { lat, lon };
    } catch {
      return null;
    }
  }
  return null;
}

function appendCamera(lat, lon) {
  const p = path.join(process.cwd(), 'public', 'community-cameras.json');
  const arr = JSON.parse(readFileSync(p, 'utf-8'));
  arr.push([lat, lon, null]);
  writeFileSync(p, JSON.stringify(arr));
}

const pending = await sql`
  select id, title from leads
  where status = 'approved' and processed_at is null
  order by reviewed_at asc
  limit 25
`;

let added = 0;
let skipped = 0;
for (const lead of pending) {
  const geo = await geocode(lead.title);
  if (geo) {
    appendCamera(geo.lat, geo.lon);
    added += 1;
  } else {
    skipped += 1;
  }
  await sql`update leads set processed_at = now() where id = ${lead.id}`;
  await new Promise((r) => setTimeout(r, 1100));
}

console.log(`ingest complete: ${added} locations added, ${skipped} skipped (unresolvable)`);
await sql.end();
