'use client';

import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {


    const measure = () => {
      const first = document.querySelector('main > :first-child');
      if (!first) return window.innerHeight;
      const r = first.getBoundingClientRect();
      return r.top + window.scrollY + r.height;
    };
    let threshold = measure();




    const check = () => setVisible(window.scrollY > threshold);
    const onResize = () => {
      threshold = measure();
      check();
    };

    check();
    const interval = setInterval(check, 500);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const onClick = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={onClick}
      className={`fixed right-4 bottom-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-navy-500/60 bg-navy-800/45 text-steel-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(4,12,22,0.5)] backdrop-blur-md transition-all duration-300 hover:border-radar-400/70 hover:bg-radar-500/15 hover:text-radar-300 sm:right-6 sm:bottom-6 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4.5 w-4.5"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
