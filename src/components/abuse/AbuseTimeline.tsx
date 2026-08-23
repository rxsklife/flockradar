'use client';

import { useMemo, useState } from 'react';
import Reveal from '@/components/Reveal';

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
  boundaries: { week: number; month: number; quarter: number; year: number };
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'quarter', label: 'This quarter' },
  { key: 'year', label: 'This year' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const yearFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });

function yearOf(ts: number): number {
  return Number(yearFmt.format(ts));
}

function monthOf(ts: number): string {
  return monthFmt.format(ts).toUpperCase();
}

function cutoffFor(boundaries: TimelineProps['boundaries'], key: FilterKey): number {
  if (key === 'all') return -Infinity;
  return boundaries[key];
}

export default function AbuseTimeline({ cases, boundaries }: TimelineProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return cases
      .filter((c) => c.ts >= cutoffFor(boundaries, filter))
      .sort((a, b) => a.ts - b.ts);
  }, [cases, filter, boundaries]);

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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-0.5 sm:gap-1.5">
        {FILTERS.map((f) => {
          const count = cases.filter((c) => c.ts >= cutoffFor(boundaries, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`mono-data rounded-sm px-1 py-1 text-[9px] uppercase tracking-[0.1em] whitespace-nowrap transition-colors sm:px-2.5 sm:py-1.5 sm:text-[10px] sm:tracking-[0.14em] ${
                filter === f.key
                  ? 'bg-radar-500/15 text-radar-300 ring-1 ring-radar-500/40'
                  : 'text-steel-400 hover:bg-navy-800 hover:text-steel-200'
              }`}
            >
              {f.label} <span className="hidden text-steel-500 sm:inline">{count}</span>
            </button>
          );
        })}
        <span className="mono-data ml-auto hidden text-[10px] uppercase tracking-[0.18em] text-steel-500 sm:block">
          {filtered.length} cases
        </span>
      </div>

      <div className="mt-6">
        {byYear.map(([year, rows]) => (
          <div key={year}>
            <Reveal>
              <div className="relative border-l border-navy-600/40 pb-4 pl-8 sm:pl-10">
                <span className="absolute -left-[5px] top-[3px] h-2.5 w-2.5 rounded-full border border-navy-500 bg-navy-900" />
                <p className="mono-data text-sm font-bold tracking-[0.22em] text-steel-300">{year}</p>
              </div>
            </Reveal>
            {rows.map((c, i) => {
              const active = activeId === c.id;
              return (
                <Reveal key={c.id} delay={Math.min(i * 40, 160)}>
                  <div
                    onMouseEnter={() => setActiveId(c.id)}
                    onMouseLeave={() => setActiveId((v) => (v === c.id ? null : v))}
                    className="relative border-l border-navy-600/40 pb-7 pl-8 sm:pl-10"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[7px] top-[26px] h-3.5 w-3.5 rounded-full border-2 transition-all duration-300 ${
                        active
                          ? 'border-radar-400 bg-radar-500 shadow-[0_0_12px_rgba(32,184,200,0.55)]'
                          : 'border-steel-400/70 bg-navy-950'
                      }`}
                    />
                    <p className="mono-data text-[10px] font-semibold tracking-[0.18em] text-radar-400/90">
                      {monthOf(c.ts)} {yearOf(c.ts)}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-steel-100">{c.title}</h3>
                    {c.summary && (
                      <p className="mt-1 text-xs leading-relaxed text-steel-400">{c.summary}</p>
                    )}
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono-data mt-2 inline-block text-[10px] uppercase tracking-[0.14em] text-radar-300 transition-colors hover:text-radar-200"
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-xs text-steel-500">No cases in this window.</p>
        )}
      </div>
    </div>
  );
}
