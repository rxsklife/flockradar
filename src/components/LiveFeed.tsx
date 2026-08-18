'use client';

import { useEffect, useMemo, useState } from 'react';

type FeedItem = {
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

const FALLBACK_ITEMS: FeedItem[] = [
  {
    title: 'Live feed unavailable. Browse verified sources instead.',
    source: 'FlockRadar',
    url: '/resources',
    iso: null,
  },
];

function relativeTime(iso: string | null, now: number): string {
  if (!iso) return 'curated';
  const diff = now - new Date(iso).getTime();
  if (diff < 60_000) return 'now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function TickerInner({
  items,
  hidden,
  now,
}: {
  items: FeedItem[];
  hidden?: boolean;
  now: number;
}) {
  return (
    <div className="flex items-center gap-8 pr-8" aria-hidden={hidden}>
      {items.map((item, i) => (
        <a
          key={`${item.url}-${i}`}
          href={item.url}
          target={item.url.startsWith('/') ? undefined : '_blank'}
          rel="noopener noreferrer"
          className="mono-data flex shrink-0 items-baseline gap-2 text-[11px] text-steel-300 transition-colors hover:text-radar-300 sm:text-xs"
        >
          <span className="text-radar-400/70" aria-hidden="true">
            ▸
          </span>
          <span className="max-w-[38ch] truncate sm:max-w-[56ch]">
            {item.title}
          </span>
          <span className="text-steel-500">via {item.source}</span>
          <span className="shrink-0 text-steel-600">
            · {relativeTime(item.iso, now)}
          </span>
        </a>
      ))}
    </div>
  );
}

export default function LiveFeed() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    fetch('/api/feed', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: FeedResponse) => setFeed(data))
      .catch(() =>
        setFeed({ items: FALLBACK_ITEMS, deflock: 0, fresh: false, at: '' })
      )
      .finally(() => clearTimeout(timer));
    return () => ctrl.abort();
  }, []);


  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const items = feed?.items?.length ? feed.items : FALLBACK_ITEMS;
  const fresh = feed?.fresh ?? false;
  const tickerDuration = useMemo(
    () => `${Math.max(28, items.length * 6)}s`,
    [items.length]
  );

  return (
    <section className="sticky top-[63px] z-30 overflow-hidden border-y border-navy-700/70 bg-navy-950/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-2.5 sm:gap-5 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`hud-led ${fresh ? 'hud-led-ok' : 'hud-led-warn'}`}
            aria-hidden="true"
          />
          <p className="mono-data text-[9px] uppercase tracking-[0.18em] text-steel-300 sm:text-[10px]">
            {fresh ? 'LIVE FEED:' : 'CURATED FEED:'}
          </p>
        </div>

        <div className="ticker-mask relative min-w-0 flex-1">
          <div
            className="ticker-track flex w-max"
            style={{ ['--ticker-duration' as string]: tickerDuration }}
          >
            <TickerInner items={items} now={now} />
            <TickerInner items={items} now={now} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
