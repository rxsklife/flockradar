import type { Metadata } from 'next';
import { db } from '@/db';
import { changelog } from '@/db/schema';
import { desc } from 'drizzle-orm';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Changelog | FlockRadar',
  description: 'A transparent record of every addition, update, and correction to the FlockRadar dataset.',
};

export const dynamic = 'force-dynamic';

const actionStyles: Record<string, { led: string; label: string }> = {
  created: { led: 'hud-led-ok', label: 'CREATED' },
  updated: { led: 'hud-led-info', label: 'UPDATED' },
  status_changed: { led: 'hud-led-info', label: 'STATUS_CHANGED' },
  corrected: { led: 'hud-led-warn', label: 'CORRECTED' },
  removed: { led: 'hud-led-warn', label: 'REMOVED' },
};

export default async function ChangelogPage() {
  const entries = await db
    .select()
    .from(changelog)
    .orderBy(desc(changelog.createdAt))
    .limit(100);

  return (
    <>
      <PageHeader
        eyebrow="Changelog"
        title="A public record of every change"
        description="Every change to the FlockRadar data, in one place."
      />

      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          <div className="space-y-4">
          {entries.length === 0 ? (
            <Reveal>
              <p className="text-steel-400">
                No changes yet. Check back after our first data release.
              </p>
            </Reveal>
          ) : (
            entries.map((entry, i) => (
              <Reveal key={entry.id} delay={Math.min(i * 40, 200)}>
                <div className="hud-card hud-scanlines card-lift rounded-md border border-navy-700 bg-navy-900 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono-data inline-flex items-center gap-1.5 rounded border border-navy-600 bg-navy-800 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-steel-200">
                      <span
                        className={`hud-led ${
                          actionStyles[entry.action]?.led ?? 'hud-led-info'
                        }`}
                        aria-hidden="true"
                      />
                      {actionStyles[entry.action]?.label ?? entry.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-steel-100">{entry.entityName}</span>
                    <span className="mono-data text-xs text-steel-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-steel-300">{entry.description}</p>
                  {entry.sourceUrl && (
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-radar-400 underline decoration-radar-400/40 underline-offset-4 transition-colors hover:text-radar-300"
                    >
                      View source
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="M7 17 17 7M7 7h10v10" />
                      </svg>
                    </a>
                  )}
                </div>
              </Reveal>
            ))
          )}
        </div>
        </div>
      </section>
    </>
  );
}
