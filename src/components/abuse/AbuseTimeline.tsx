'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface AbuseCaseRow {
  id: string;
  title: string;
  summary: string | null;
  url: string | null;
  sourceName: string | null;
  displayDate: string;
  ts: number;
}

export interface TimelineProps {
  cases: AbuseCaseRow[];
  todayTs: number;
  rangeStartLabel: string;
  rangeEndLabel: string;
}

const FILTERS = [
  { key: 'all', label: 'All', days: null as number | null },
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'This month', days: 30 },
  { key: 'quarter', label: 'This quarter', days: 90 },
  { key: 'year', label: 'This year', days: 365 },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const YEAR_COLORS: Record<number, string> = {
  2013: '#8a93a3',
  2021: '#e58a4a',
  2022: '#d07a74',
  2023: '#b48ad9',
  2024: '#4aa8d8',
  2025: '#20b8c8',
  2026: '#45c98a',
};

function yearOf(ts: number): number {
  return Number(new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' }).format(ts));
}

function yearColor(year: number): string {
  return YEAR_COLORS[year] ?? '#8a93a3';
}

const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

function monthOf(ts: number): string {
  return monthFmt.format(ts).toUpperCase();
}

function colorFor(ts: number): string {
  return yearColor(yearOf(ts));
}

export default function AbuseTimeline({ cases, todayTs, rangeStartLabel, rangeEndLabel }: TimelineProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const dragRef = useRef<{ y: number; top: number; moved: boolean } | null>(null);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    const cutoff = f?.days === null ? -Infinity : todayTs - (f?.days ?? 0) * 86400000;
    const list = cases.filter((c) => c.ts >= cutoff);
    return list.slice().sort((a, b) => a.ts - b.ts);
  }, [cases, filter, todayTs]);

  const byYear = useMemo(() => {
    const map = new Map<number, AbuseCaseRow[]>();
    for (const c of filtered) {
      const y = yearOf(c.ts);
      const arr = map.get(y) ?? [];
      arr.push(c);
      map.set(y, arr);
    }
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target as HTMLElement | undefined;
        if (top?.dataset.id) setActiveId(top.dataset.id);
      },
      { root: canvas, rootMargin: '-15% 0px -50% 0px', threshold: [0.05, 0.5] },
    );
    for (const el of rowRefs.current.values()) obs.observe(el);
    return () => obs.disconnect();
  }, [filtered]);

  const onScroll = () => {
    const c = canvasRef.current;
    if (!c || c.scrollHeight <= c.clientHeight) return;
    setProgress(c.scrollTop / (c.scrollHeight - c.clientHeight));
  };

  const scrollToCase = (id: string) => {
    const el = rowRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    dragRef.current = { y: e.clientY, top: c.scrollTop, moved: false };
    c.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = canvasRef.current;
    const d = dragRef.current;
    if (!c || !d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 4) d.moved = true;
    c.scrollTop = d.top - dy;
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="hud-card hud-scanlines overflow-hidden rounded-md border border-navy-700 bg-navy-900/90 shadow-lg">
      <div className="flex items-center justify-between border-b border-navy-700/70 px-4 py-2">
        <p className="mono-data text-[10px] uppercase tracking-[0.2em] text-steel-300">
          {'// '}Incident Timeline
        </p>
        <p className="mono-data text-[10px] uppercase tracking-[0.2em] text-steel-500">
          {filtered.length} cases · drag to pan
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pt-3">
        {FILTERS.map((f) => {
          const days = f.days;
          const count =
            days === null ? cases.length : cases.filter((c) => c.ts >= todayTs - days * 86400000).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`mono-data rounded-sm px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                filter === f.key
                  ? 'bg-radar-500/20 text-radar-300 ring-1 ring-radar-500/40'
                  : 'text-steel-400 hover:bg-navy-800 hover:text-steel-200'
              }`}
            >
              {f.label} <span className="text-steel-500">{count}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={canvasRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="tl-canvas relative mt-3 max-h-[65vh] cursor-grab select-none overflow-y-auto overscroll-contain px-4 pb-4 active:cursor-grabbing"
      >
        {byYear.map(([year, rows]) => (
          <div key={year}>
            <div className="relative ml-9 flex items-center gap-3 py-2">
              <span
                className="mono-data absolute -left-[38px] text-sm font-bold"
                style={{ color: yearColor(year) }}
              >
                {year}
              </span>
              <span className="hud-led shrink-0" style={{ background: yearColor(year) }} />
              <span className="h-px flex-1" style={{ background: yearColor(year) }} />
            </div>
            {rows.map((c) => {
              const color = colorFor(c.ts);
              const active = activeId === c.id;
              return (
                <div
                  key={c.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(c.id, el);
                  }}
                  data-id={c.id}
                  className="group relative ml-9 border-l-2 py-3 pl-6"
                  style={{ borderColor: color }}
                >
                  <button
                    onClick={() => scrollToCase(c.id)}
                    aria-label="Focus this case"
                    className={`tl-node absolute -left-[13px] top-[22px] h-[18px] w-[18px] rounded-full border-2 bg-navy-950 transition-all ${
                      active ? 'tl-node-active' : ''
                    }`}
                    style={{ borderColor: color, boxShadow: active ? `0 0 12px ${color}` : undefined }}
                  />
                  <p className="mono-data text-[10px] font-semibold tracking-[0.18em]" style={{ color }}>
                    {monthOf(c.ts)} {yearOf(c.ts)}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-steel-100">{c.title}</h3>
                  {c.summary && <p className="mt-1 text-xs leading-relaxed text-steel-400">{c.summary}</p>}
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono-data mt-2 inline-block text-[10px] uppercase tracking-[0.14em] text-radar-300 hover:text-radar-200"
                    >
                      Source ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-2 py-10 text-center text-xs text-steel-500">No cases in this window.</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-navy-700/70 px-4 py-2">
        <span className="mono-data text-[10px] uppercase tracking-[0.18em] text-steel-500">{rangeStartLabel}</span>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-navy-800">
          <div
            className="h-full bg-radar-500/70 transition-[width] duration-150"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="mono-data text-[10px] uppercase tracking-[0.18em] text-steel-500">{rangeEndLabel}</span>
      </div>
    </div>
  );
}
