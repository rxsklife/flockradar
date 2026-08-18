'use client';

import { useEffect, useState } from 'react';

const TUTORIAL_KEY = 'flockradar-tutorial-v1';

export default function TutorialHint() {


  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && !!window.localStorage.getItem(TUTORIAL_KEY),
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!isMobile || dismissed) return null;

  const done = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {

    }
    setDismissed(true);
  };

  return (


    <div className="pointer-events-none absolute inset-0 z-[1200]">
      {expanded ? (


        <div
          className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-navy-950/90 p-4"
          onClick={done}
        >
          <div
            className="tutorial-card w-full max-w-sm rounded-xl border border-navy-600 bg-navy-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-steel-100">Welcome to FlockRadar</h2>
            <p className="mt-1 text-xs text-steel-400">A few quick tips before you explore:</p>
            <ul className="mt-3 space-y-3">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#20b8c8] text-[10px] font-bold text-navy-950">
                  12
                </span>
                <div>
                  <p className="text-sm font-semibold text-steel-100">Numbered circles</p>
                  <p className="text-xs leading-snug text-steel-400">
                    Tap a circle to zoom in and reveal the cameras inside that area.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- tutorial icon */}
                <img src="/police-marker.png" alt="" className="mt-0.5 h-6 w-6 shrink-0" draggable={false} />
                <div>
                  <p className="text-sm font-semibold text-steel-100">Police badge icons</p>
                  <p className="text-xs leading-snug text-steel-400">
                    Tap one to see the deployment&apos;s evidence, street address, and Street View.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- tutorial icon */}
                <img src="/flock-marker.png" alt="" className="flock-legend-icon mt-0.5 h-6 w-6 shrink-0" draggable={false} />
                <div>
                  <p className="text-sm font-semibold text-steel-100">Flock camera icons</p>
                  <p className="text-xs leading-snug text-steel-400">
                    Community-reported cameras. Tap one to see the street address and Street View.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-navy-800 text-steel-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                    <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-steel-100">Filters</p>
                  <p className="text-xs leading-snug text-steel-400">
                    Use Filters (bottom-left) to narrow by state, status, or vendor.
                  </p>
                </div>
              </li>
            </ul>
            <button
              onClick={done}
              className="mt-5 w-full rounded-lg bg-radar-500 px-4 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-radar-400"
            >
              Back to map
            </button>
          </div>
        </div>
      ) : (

        <div className="pointer-events-auto absolute bottom-32 left-4 right-4 flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-900/95 shadow-lg">
          <button
            onClick={() => setExpanded(true)}
            className="flex flex-1 items-center gap-2 px-3 py-2.5 text-left transition-colors hover:text-radar-300"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- tutorial icon */}
            <img src="/logo.png" alt="" className="h-5 w-5 shrink-0" draggable={false} />
            <span className="flex-1 text-xs font-medium text-steel-100">New here? Tap for map tips</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-steel-400" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button
            onClick={done}
            aria-label="Dismiss map tips"
            title="Dismiss"
            className="shrink-0 px-2 py-2.5 text-steel-400 transition-colors hover:text-steel-200"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
