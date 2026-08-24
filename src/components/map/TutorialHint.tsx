'use client';

import { useEffect, useState } from 'react';

export default function TutorialHint() {

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!isMobile) return null;

  const done = () => setExpanded(false);

  return (


    <div className="pointer-events-none absolute inset-0 z-[1200]">
      {expanded ? (


        <div
          className="pointer-events-auto absolute inset-0 flex items-center justify-center overflow-y-auto bg-navy-950/70 p-4 backdrop-blur-sm"
          onClick={done}
        >
          <div
            className="hud-panel hud-card relative my-auto w-full max-w-sm p-5 shadow-[0_20px_60px_rgba(2,8,16,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-steel-100">Welcome to FlockRadar</h2>
            <p className="mt-1 text-xs text-steel-400">A few quick tips before you explore:</p>
            <ul className="mt-3 divide-y divide-radar-500/15">
              <li className="flex gap-3 py-2 text-left">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-radar-500/50 bg-radar-500/15 text-[10px] font-bold text-radar-300">
                  12
                </span>
                <div className="text-left">
                  <p className="text-left text-sm font-semibold text-steel-100">Numbered circles</p>
                  <p className="text-left text-xs leading-snug text-steel-400">
                    Tap a circle to zoom in and reveal the cameras inside that area.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 py-2 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element -- tutorial icon */}
                <img src="/police-marker.png" alt="" className="mt-0.5 h-6 w-6 shrink-0" draggable={false} />
                <div className="text-left">
                  <p className="text-left text-sm font-semibold text-steel-100">Police badge icons</p>
                  <p className="text-left text-xs leading-snug text-steel-400">
                    Tap one to see the deployment&apos;s evidence, street address, and Street View.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 py-2 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element -- tutorial icon */}
                <img src="/flock-marker.png" alt="" className="flock-legend-icon mt-0.5 h-6 w-6 shrink-0" draggable={false} />
                <div className="text-left">
                  <p className="text-left text-sm font-semibold text-steel-100">Flock camera icons</p>
                  <p className="text-left text-xs leading-snug text-steel-400">
                    Community-reported cameras. Tap one to see the street address and Street View.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 py-2 text-left">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-radar-500/30 bg-navy-950/60 text-steel-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                    <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <div className="text-left">
                  <p className="text-left text-sm font-semibold text-steel-100">Filters</p>
                  <p className="text-left text-xs leading-snug text-steel-400">
                    Use Filters (bottom-left) to narrow by state, status, or vendor.
                  </p>
                </div>
              </li>
            </ul>
            <button
              onClick={done}
              className="btn-primary mt-5 w-full px-4! py-2.5! text-sm!"
            >
              Back to map
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          aria-label="Open map tips"
          title="Map tips"
          className="pointer-events-auto absolute bottom-24 right-[10px] z-[1000] flex h-8 w-8 items-center justify-center rounded-[4px] border border-radar-500/45 bg-navy-950/80 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md backdrop-saturate-150 transition-colors hover:bg-radar-500/25 sm:bottom-64"
        >
          ?
        </button>
      )}
    </div>
  );
}
