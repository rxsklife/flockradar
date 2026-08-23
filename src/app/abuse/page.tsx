import type { Metadata } from 'next';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { abuseCases } from '@/db/schema';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reported Abuse',
  description:
    'Documented cases of license plate reader misuse: stalking, harassment, unlawful surveillance, and other abuses involving ALPR data.',
};

export default async function AbusePage() {
  const cases = await db
    .select()
    .from(abuseCases)
    .where(eq(abuseCases.status, 'approved'))
    .orderBy(desc(abuseCases.publishedAt))
    .limit(100);

  return (
    <>
      <PageHeader
        eyebrow="// ABUSE LOG"
        title="Reported cases of abuse"
        description="Documented misuse of license plate reader data. Each case links to its source. New reports are scanned daily and reviewed before publication."
      />

      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          {cases.length === 0 ? (
            <Reveal>
              <p className="text-steel-400">
                No published cases yet. Reports are reviewed daily and appear here once approved.
              </p>
            </Reveal>
          ) : (
            <div className="space-y-4">
              {cases.map((c, i) => (
                <Reveal key={c.id} delay={Math.min(i * 40, 200)}>
                  <div className="hud-card hud-scanlines card-lift rounded-md border border-navy-700 bg-navy-900 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono-data inline-flex items-center gap-1.5 rounded border border-navy-600 bg-navy-800 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-steel-200">
                        <span className="hud-led hud-led-warn" aria-hidden="true" />
                        ABUSE CASE {c.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span className="mono-data text-xs text-steel-400">
                        {c.publishedAt
                          ? new Date(c.publishedAt).toLocaleDateString()
                          : new Date(c.createdAt).toLocaleDateString()}
                      </span>
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
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
