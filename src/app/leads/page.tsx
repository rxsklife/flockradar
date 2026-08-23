import type { Metadata } from 'next';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { leads } from '@/db/schema';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reported Leads',
  description:
    'Recently reported license plate reader deployments awaiting verification. Every lead links to its source article.',
};

export default async function LeadsPage() {
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.status, 'approved'))
    .orderBy(desc(leads.publishedAt))
    .limit(100);

  return (
    <>
      <PageHeader
        eyebrow="// LEAD LOG"
        title="Reported leads awaiting verification"
        description="News reports of possible new deployments, gathered daily and reviewed before anything reaches the map. Each lead links to its source."
      />

      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          {rows.length === 0 ? (
            <Reveal>
              <p className="text-steel-400">
                No published leads yet. Daily scans surface new reports and approved items appear here.
              </p>
            </Reveal>
          ) : (
            <div className="space-y-4">
              {rows.map((row, i) => (
                <Reveal key={row.id} delay={Math.min(i * 40, 200)}>
                  <div className="hud-card hud-scanlines card-lift rounded-md border border-navy-700 bg-navy-900 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono-data inline-flex items-center gap-1.5 rounded border border-navy-600 bg-navy-800 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-steel-200">
                        <span className="hud-led hud-led-info" aria-hidden="true" />
                        LEAD {row.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span className="mono-data text-xs text-steel-400">
                        {row.publishedAt
                          ? new Date(row.publishedAt).toLocaleDateString()
                          : new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-steel-100">{row.title}</h3>
                    {row.sourceName && (
                      <p className="mono-data mt-2 text-xs text-steel-400">via {row.sourceName}</p>
                    )}
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-radar-400 underline decoration-radar-400/40 underline-offset-4 transition-colors hover:text-radar-300"
                    >
                      Read the report
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
                    </a>
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
