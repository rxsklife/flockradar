import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export type FeedItem = {
  title: string;
  source: string;
  url: string;
  iso: string | null;
};

type FeedResponse = {
  items: FeedItem[];
  deflock: number;
  fresh: boolean;
  at: string;
};

const QUERIES = [
  'ALPR OR "license plate reader" OR "Flock Safety"',
  'deflock OR "#deflock" OR "De-Flock"',
];

const INCLUDE =
  /alpr|license plate|plate reader|plate-recogn|lpr|flock|deflock|surveillance camera|automated license|automatic license/i;
const EXCLUDE =
  /speed camera|red-light|red light|toll booth|toll camera|bird|sheep|flock of|wildlife/i;

const CURATED: FeedItem[] = [
  {
    title: 'State of Surveillance: ACLU coalition maps plate reader deployments',
    source: 'ACLU',
    url: 'https://stateofsurveillance.org/',
    iso: null,
  },
  {
    title: 'EFF: surveillance technology issues, policy, and resources',
    source: 'EFF',
    url: 'https://www.eff.org/issues/surveillance',
    iso: null,
  },
  {
    title: 'EFF Deeplinks: news on privacy, surveillance, and civil liberties',
    source: 'EFF',
    url: 'https://www.eff.org/deeplinks',
    iso: null,
  },
  {
    title: 'Automatic number-plate recognition: background and privacy concerns',
    source: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Automatic_number-plate_recognition',
    iso: null,
  },
];

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_ITEMS = 24;
const MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

let cache: { at: number; data: FeedResponse } | null = null;

function stripCdata(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function parseRss(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of blocks) {
    const titleRaw = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? '';
    const sourceRaw =
      block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? '';

    const title = stripCdata(titleRaw);
    const source = stripCdata(sourceRaw);
    if (!title || !link) continue;

    const iso = pubDate ? new Date(pubDate).toISOString() : null;
    if (!iso) continue;
    if (Date.now() - new Date(iso).getTime() > MAX_AGE_MS) continue;



    const cleanTitle =
      source && title.endsWith(` - ${source}`)
        ? title.slice(0, -(source.length + 3))
        : title;

    items.push({ title: cleanTitle, source, url: link, iso });
  }
  return items;
}

async function fetchQuery(q: string): Promise<FeedItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    q
  )}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { 'user-agent': 'flockradar-feed/0.1 (+https://flockradar.com)' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  return parseRss(await res.text());
}

function buildResponse(): Promise<FeedResponse> {
  return Promise.all(QUERIES.map(fetchQuery)).then(([main, deflock]) => {
    const seen = new Set<string>();
    const items: FeedItem[] = [];

    const push = (item: FeedItem) => {
      if (!INCLUDE.test(item.title.toLowerCase())) return;
      if (EXCLUDE.test(item.title.toLowerCase())) return;
      const key = `${item.source}|${item.title}`.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ ...item, iso: item.iso });
    };

    for (const item of main) push(item);
    for (const item of deflock) push(item);

    items.sort((a, b) =>
      (b.iso ?? '').localeCompare(a.iso ?? '')
    );

    return {
      items: items.slice(0, MAX_ITEMS),
      deflock: deflock.length,
      fresh: true,
      at: new Date().toISOString(),
    };
  });
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'cache-control': 'no-store' },
    });
  }

  try {
    const data = await buildResponse();
    cache = { at: Date.now(), data };
    return NextResponse.json(data, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch {

    const fallback: FeedResponse = {
      items: CURATED,
      deflock: 0,
      fresh: false,
      at: new Date().toISOString(),
    };
    return NextResponse.json(fallback, {
      headers: { 'cache-control': 'no-store' },
    });
  }
}
