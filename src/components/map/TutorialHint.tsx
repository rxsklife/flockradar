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
          className="pointer-events-auto absolute inset-0 flex items-center justify-center overflow-y-auto bg-navy-950/90 p-4"
          onClick={done}
        >
          <div
            className="tutorial-card my-auto w-full max-w-sm rounded-xl border border-navy-500/40 bg-navy-900/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_30px_rgba(2,8,16,0.45)] backdrop-blur-md backdrop-saturate-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-steel-100">Welcome to FlockRadar</h2>
            <p className="mt-1 text-xs text-steel-400">A few quick tips before you explore:</p>
            <ul className="mt-3 space-y-2">
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
        <button
          onClick={() => setExpanded(true)}
          aria-label="Open map tips"
          title="Map tips"
          className="hud-chip pointer-events-auto absolute bottom-24 right-4 z-[1000] h-9 w-9 p-0 text-base font-bold text-radar-300 hover:text-white sm:bottom-64"
        >
          ?
        </button>
      )}
    </div>
  );
}
