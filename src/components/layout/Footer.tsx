'use client';

import { useState } from 'react';
import Link from 'next/link';
import SocialLinks from '@/components/layout/SocialIcons';

const BTC_ADDRESS = 'bc1qwsagnc3s25j225j5gfgg22e3eyjgz7vwt93f75';

export default function Footer() {
  const [copied, setCopied] = useState(false);

  async function copyBtc() {
    try {
      await navigator.clipboard.writeText(BTC_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {

      const ta = document.createElement('textarea');
      ta.value = BTC_ADDRESS;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <footer className="relative overflow-hidden border-t border-navy-700 bg-navy-950">
      {}
      {/* eslint-disable-next-line @next/next/no-img-element -- static bg art */}
      <img
        src="/bg-footer.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full -scale-y-100 object-cover object-center opacity-60"
        width={1935}
        height={553}
        draggable={false}
      />
      {}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/70 to-navy-950/30"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-8 text-sm text-steel-400 sm:px-6 lg:px-8">
        {}
        <div className="mb-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static BTC logo */}
          <img
            src="/bitcoin-logo.png"
            alt="Bitcoin"
            width={20}
            height={20}
            className="h-5 w-5 opacity-90 invert"
            draggable={false}
          />
          <button
            type="button"
            onClick={copyBtc}
            aria-label="Copy Bitcoin address to clipboard"
            title="Click to copy Bitcoin address"
            className="group relative inline-flex items-center gap-2 rounded border border-navy-600 bg-navy-800/60 px-3 py-1.5 font-mono text-xs text-steel-200 transition-colors duration-200 hover:border-radar-500/60 hover:text-radar-300"
          >
            <span>{BTC_ADDRESS}</span>
            {}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded border border-radar-500/50 bg-navy-900 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-radar-300 whitespace-nowrap transition-all duration-200 ${
                copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
              }`}
            >
              copied to clipboard
            </span>
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-green-400" aria-hidden="true">
                <path d="m5 13 4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-steel-400 transition-colors group-hover:text-radar-300" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
        {}
        <p className="whitespace-nowrap text-center text-[clamp(6px,1.95vw,10px)] leading-relaxed sm:text-[11px] lg:text-[clamp(10.5px,1.08vw,14px)]">
          FlockRadar is an open-source public-disclosure project. Every dot on the map links to a
          public record.
          <span className="block lg:inline">
            {' '}This site does not host live feeds, passwords, or data that identifies a specific
            vehicle.
          </span>
        </p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
          <Link href="/methodology" className="underline transition-colors hover:text-radar-300">
            Methodology
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/publishing-policy"
            className="underline transition-colors hover:text-radar-300"
          >
            Publishing Policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/correct" className="underline transition-colors hover:text-radar-300">
            Request Correction
          </Link>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          {}
          <span className="flex w-full items-center justify-center gap-x-3 sm:w-auto sm:gap-x-1.5">
            <SocialLinks iconClassName="h-5 w-5 sm:h-4 sm:w-4" />
          </span>
        </p>
      </div>
    </footer>
  );
}
