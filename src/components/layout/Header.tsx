'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import SocialLinks from '@/components/layout/SocialIcons';

const navLinks = [
  { href: '/methodology', label: 'Methodology' },
  { href: '/resources', label: 'Resources' },
  { href: '/submit', label: 'Submit a Tip' },
  { href: '/changelog', label: 'Changelog' },

  { href: '/map', label: 'Map' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-navy-700/70 bg-navy-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 text-xl font-bold text-steel-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand logo */}
          <img
            src="/logo.png"
            alt="FlockRadar logo"
            className="h-8 w-8 transition-transform duration-200 group-hover:scale-105"
            draggable={false}
          />
          FlockRadar
        </Link>
        <div className="hidden items-center gap-1 text-sm font-medium text-steel-300 sm:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            if (link.href === '/map') {


              return (
                <Fragment key={link.href}>
                  <span className="flex items-center gap-3 pr-1">
                    <SocialLinks iconClassName="h-4 w-4" />
                  </span>
                  <Link
                    href={link.href}
                    className="btn-primary px-3! py-1.5! text-xs!"
                  >
                    Map
                  </Link>
                </Fragment>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-md px-3 py-2 transition-colors duration-200 hover:text-radar-300 ${
                  active ? 'text-radar-300' : ''
                }`}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-radar-400"
                  />
                )}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3 sm:hidden">
          <SocialLinks iconClassName="h-4 w-4" />
          <Link href="/map" className="btn-primary px-4! py-2!">
            Map
          </Link>
        </div>
      </nav>
    </header>
  );
}
