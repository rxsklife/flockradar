#!/usr/bin/env node

import postgres from 'postgres';

const CASES = [
  {
    url: 'https://abcnews.com/US/officer-allegedly-flock-license-plate-cameras-track-boyfriends/story?id=135418955',
    title: 'Officers stalking romantic interests',
    summary:
      'A police officer in North Carolina was arrested in August 2026 for using Flock plate readers 31 times to track her boyfriend\u2019s ex-wife. Her own department caught her during an audit. Researchers at the Institute for Justice found at least 14 cases in recent years where officers used plate readers to stalk romantic interests.',
    sourceName: 'ABC News',
    publishedAt: '2026-08-01',
  },
  {
    url: 'https://www.techtimes.com/articles/322912/20260804/police-turned-flocks-license-plate-network-stalking-tool-least-50-cases.htm',
    title: 'At least 50 officers accused nationwide',
    summary:
      'Investigations have found at least 50 officers across the country accused of using Flock\u2019s plate network to stalk people they knew personally. That is a pattern, not a few bad apples.',
    sourceName: 'TechTimes',
    publishedAt: '2026-08-04',
  },
  {
    url: 'https://www.firstalert4.com/2026/08/03/brentwood-officer-accused-using-license-plate-reader-stalk-ex-wife/',
    title: 'Policy violations without criminal consequences',
    summary:
      'A Missouri officer admitted using Flock cameras to track his ex-wife during a divorce. Investigators confirmed he broke department policy, then closed the case anyway because no crime existed under state law.',
    sourceName: 'First Alert 4',
    publishedAt: '2026-08-03',
  },
  {
    url: 'https://stateofsurveillance.org/articles/surveillance/flock-safety-license-plate-readers-ice-2025/',
    title: 'Local crime tool to federal immigration surveillance',
    summary:
      'Plate data collected for local police has ended up in immigration enforcement. Investigations show Flock data used in ICE operations and federal agencies tapping into local camera networks. Most communities never agreed to that.',
    sourceName: 'State of Surveillance',
    publishedAt: '2025-11-20',
  },
];

const sql = postgres(process.env.DATABASE_URL, { max: 2 });

try {
  let inserted = 0;
  for (const c of CASES) {
    const [row] = await sql`
      insert into abuse_cases (url, title, summary, source_name, published_at, status, reviewed_at)
      values (${c.url}, ${c.title}, ${c.summary}, ${c.sourceName}, ${new Date(c.publishedAt)}, 'approved', now())
      on conflict (url) do nothing
      returning id
    `;
    if (row) inserted += 1;
  }
  console.log(`Seeded ${inserted} approved abuse cases.`);
} finally {
  await sql.end();
}
