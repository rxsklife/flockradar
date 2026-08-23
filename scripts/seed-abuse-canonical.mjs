#!/usr/bin/env node

import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const CASES = JSON.parse(readFileSync(new URL('./abuse-cases.json', import.meta.url), 'utf-8'));

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('sslmode=require') ? 'require' : false,
});

await sql`truncate table abuse_cases`;

for (const c of CASES) {
  await sql`
    insert into abuse_cases (url, title, summary, published_at, status)
    values (${c.url}, ${c.title}, ${c.summary}, ${c.publishedAt}, 'approved')
  `;
}

const count = await sql`select count(*) as n from abuse_cases`;
console.log('TOTAL:', count[0].n);
await sql.end();
