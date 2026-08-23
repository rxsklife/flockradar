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
  rangeMin: number;
  rangeMax: number;
  yearTicks: { ts: number; label: string }[];
  rangeStartLabel: string;
  rangeEndLabel: string;
}

type FilterKey = 'week' | 'month' | 'quarter' | 'year' | 'all';

const FILTERS: { key: FilterKey; label: string; days: number | null }[] = [
  { key: 'all', label: 'All', days: null },
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'This month', days: 30 },
  { key: 'quarter', label: 'This quarter', days: 90 },
  { key: 'year', label: 'This year', days: 365 },
];

export default function AbuseTimeline({
  cases,
  todayTs,
  rangeMin,
  rangeMax,
  yearTicks,
  rangeStartLabel,
  rangeEndLabel,
}: TimelineProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number; active: boolean }>({ x: 0, scroll: 0, active: false });
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    const sorted = [...cases].sort((a, b) => b.ts - a.ts);
    if (!f || f.days === null) return sorted;
    const cutoff = todayTs - f.days * 86400000;
    return sorted.filter((c) => c.ts >= cutoff);
  }, [cases, filter, todayTs]);

  const pos = (ts: number) => ((ts - rangeMin) / (rangeMax - rangeMin)) * 100;

  const activeCase = activeId ? filtered.find((c) => c.id === activeId) : null;

  useEffect(() => {
    if (!trackRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length === 0) return;
        const id = visible[0].target.getAttribute('data-case-id');
        if (id) setActiveId(id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );
    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered]);

  useEffect(() => {
    if (!activeId || !trackRef.current) return;
    const el = trackRef.current.querySelector(`[data-marker-id="${activeId}"]`);
    if (!el) return;
    const track = trackRef.current;
    const target = (el as HTMLElement).offsetLeft - track.clientWidth / 2;
    track.scrollLeft = Math.max(0, target);
  }, [activeId]);

  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    drag.current = { x: e.clientX, scroll: track.scrollLeft, active: true };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track || !drag.current.active) return;
    track.scrollLeft = drag.current.scroll - (e.clientX - drag.current.x);
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const days = f.days;
          const count =
            days === null
              ? cases.length
              : cases.filter((c) => c.ts >= todayTs - days * 86400000).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`mono-data rounded-md border px-3 py-1.5 text-xs transition-colors ${
                filter === f.key
                  ? 'border-radar-500/60 bg-radar-500/15 text-radar-200'
                  : 'border-navy-600 bg-navy-900/60 text-steel-300 hover:border-navy-500 hover:text-steel-100'
              }`}
            >
              {f.label} <span className="text-steel-500">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="hud-card hud-scanlines sticky! top-16 z-30 rounded-md border border-navy-700 bg-navy-900/90 p-4 shadow-lg backdrop-blur-md">
        <div className="mono-data mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-steel-500">
          <span>Incident timeline</span>
          <span>drag to pan</span>
        </div>
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          className="timeline-track cursor-grab touch-pan-x select-none overflow-x-auto active:cursor-grabbing"
        >
          <div className="timeline-axis relative" style={{ width: 1200 }}>
            {yearTicks.map((y) => (
              <div key={y.label} className="timeline-year" style={{ left: `${pos(y.ts)}%` }}>
                <span className="mono-data text-[10px] text-steel-500">{y.label}</span>
              </div>
            ))}
            {filtered.map((c) => (
              <button
                key={c.id}
                data-marker-id={c.id}
                style={{ left: `${pos(c.ts)}%` }}
                onClick={() => {
                  const el = cardRefs.current.get(c.id);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                title={c.title}
                aria-label={c.title}
                className={`timeline-marker ${activeId === c.id ? 'is-active' : ''}`}
              />
            ))}
            <div
              className={`timeline-active-bracket ${activeCase ? 'is-visible' : ''}`}
              style={activeCase ? { left: `${pos(activeCase.ts)}%` } : undefined}
            />
          </div>
        </div>
        <div className="mono-data mt-1 flex justify-between text-[10px] text-steel-500">
          <span>{rangeStartLabel}</span>
          <span>{rangeEndLabel}</span>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((c) => (
          <article
            key={c.id}
            data-case-id={c.id}
            ref={(el) => {
              if (el) cardRefs.current.set(c.id, el);
              else cardRefs.current.delete(c.id);
            }}
            className={`hud-card card-lift rounded-md border bg-navy-900 p-5 shadow-sm transition-opacity duration-300 ${
              activeId === c.id ? 'border-radar-500/40 opacity-100' : 'border-navy-700 opacity-90'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono-data inline-flex items-center gap-1.5 rounded border border-navy-600 bg-navy-800 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-steel-200">
                <span className="hud-led hud-led-warn" aria-hidden="true" />
                ABUSE CASE {c.id.slice(0, 4).toUpperCase()}
              </span>
              <span className="mono-data text-xs text-steel-400">{c.displayDate}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold text-steel-100">{c.title}</h3>
            {c.summary && <p className="mt-1.5 text-sm text-steel-300">{c.summary}</p>}
            {c.sourceName && (
              <p className="mono-data mt-2 text-xs text-steel-400">via {c.sourceName}</p>
            )}
            {c.url && (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-radar-400 underline decoration-radar-400/40 underline-offset-4 transition-colors hover:text-radar-300"
              >
                Read the report
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
              </a>
            )}
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="text-steel-400">
            No published cases in this window yet. New reports are reviewed daily.
          </p>
        )}
      </div>
    </div>
  );
}
