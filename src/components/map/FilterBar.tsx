'use client';

import { useState } from 'react';
import { statusLegend } from '@/lib/legend';

interface FilterBarProps {
  filters: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
  variant?: 'desktop' | 'mobile';
  communityLayerOn?: boolean;
  onToggleCommunity?: (on: boolean) => void;
  communityLoading?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ENTITY_TYPES = [
  'city',
  'county',
  'police_department',
  'sheriff',
  'school_district',
  'hoa',
  'transit_agency',
];

const VENDORS = ['Flock Safety', 'other', 'unknown'];

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export default function FilterBar({
  filters,
  onChange,
  variant = 'desktop',
  communityLayerOn = false,
  onToggleCommunity,
  communityLoading = false,
  onOpenChange,
}: FilterBarProps) {
  const isMobile = variant === 'mobile';


  const [open, setOpen] = useState(false);

  if (!isMobile && !open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          onOpenChange?.(true);
        }}
        className="hud-chip absolute right-4 top-4 z-[1000] hidden! gap-1.5 px-3 py-2 text-xs font-semibold sm:flex!"
        aria-label="Open filters"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h18l-7 9v5l-4-2v-3L3 5z" />
        </svg>
        Filters
      </button>
    );
  }

  return (
    <div
      className={
        isMobile
          ? 'w-full'
          : 'hud-panel absolute right-4 top-4 z-[1000] hidden! w-56 p-3 sm:block!'
      }
    >
      <div className="mb-2 flex items-center justify-between pr-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-steel-400">
          Filters
        </h3>
        {!isMobile && (
          <button
            onClick={() => {
              setOpen(false);
              onOpenChange?.(false);
            }}
            className="rounded p-0.5 text-steel-400 transition-colors hover:bg-navy-800 hover:text-steel-100"
            aria-label="Close filters"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <div className={isMobile ? 'mb-2' : 'mb-3'}>
        <label className="mb-1 block text-xs text-steel-300">State</label>
        <select
          value={filters.state || ''}
          onChange={(e) => onChange('state', e.target.value)}
          className="hud-chip w-full px-2 py-1 text-xs text-steel-100"
        >
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className={isMobile ? 'mb-2' : 'mb-3'}>
        <label className="mb-1 block text-xs text-steel-300">Status</label>
        <select
          value={filters.status || ''}
          onChange={(e) => onChange('status', e.target.value)}
          className="hud-chip w-full px-2 py-1 text-xs text-steel-100"
        >
          <option value="">All</option>
          {statusLegend.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className={isMobile ? 'mb-2' : 'mb-3'}>
        <label className="mb-1 block text-xs text-steel-300">Entity type</label>
        <select
          value={filters.entityType || ''}
          onChange={(e) => onChange('entityType', e.target.value)}
          className="hud-chip w-full px-2 py-1 text-xs text-steel-100"
        >
          <option value="">All</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className={isMobile ? 'mb-2' : 'mb-3'}>
        <label className="mb-1 block text-xs text-steel-300">Vendor</label>
        <select
          value={filters.vendor || ''}
          onChange={(e) => onChange('vendor', e.target.value)}
          className="hud-chip w-full px-2 py-1 text-xs text-steel-100"
        >
          <option value="">All</option>
          {VENDORS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className={isMobile ? 'mb-2' : 'mb-3'}>
        <label className="mb-1 block text-xs text-steel-300">Evidence level</label>
        <select
          value={filters.sourceStrength || ''}
          onChange={(e) => onChange('sourceStrength', e.target.value)}
          className="hud-chip w-full px-2 py-1 text-xs text-steel-100"
        >
          <option value="">All evidence</option>
          <option value="primary">Primary source only</option>
          <option value="secondary">Primary or secondary</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-steel-300">Point type</label>
        <select
          value={filters.pointType || ''}
          onChange={(e) => onChange('pointType', e.target.value)}
          className="hud-chip w-full px-2 py-1 text-xs text-steel-100"
        >
          <option value="">All points</option>
          <option value="entity_level">Entity-level only</option>
          <option value="exact">Exact locations only</option>
        </select>
      </div>

      {onToggleCommunity && (
        <div className="mt-3 border-t border-radar-500/20 pt-3">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={communityLayerOn}
              onChange={(e) => onToggleCommunity(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-[#20b8c8]"
            />
            <span className="text-xs leading-tight text-steel-200">
              <span className="font-medium text-steel-100">Community Reported Cameras</span>
              <span className="mt-0.5 block text-[11px] text-steel-400">
                {communityLoading
                  ? 'Loading cameras…'
                  : 'Community reported, unverified.'}
              </span>
            </span>
          </label>
          {communityLayerOn && (
            <div className="mt-2 space-y-2">
              <p className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] leading-snug text-amber-400">
                Community reported. Unverified.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
