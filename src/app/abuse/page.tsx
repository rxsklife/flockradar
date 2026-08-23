import type { Metadata } from 'next';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { abuseCases } from '@/db/schema';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import AbuseTimeline, {
  type AbuseCaseRow,
  type TimelineProps,
} from '@/components/abuse/AbuseTimeline';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reported Abuse',
  description:
    'Documented cases of license plate reader misuse: stalking, harassment, unlawful surveillance, and other abuses involving ALPR data.',
};

const shortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const cardDateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const yearFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' });

export default async function AbusePage() {
  const rows = await db
    .select()
    .from(abuseCases)
    .where(eq(abuseCases.status, 'approved'))
    .orderBy(desc(abuseCases.publishedAt))
    .limit(200);

  const cases: AbuseCaseRow[] = rows.map((c) => {
    const ts = (c.publishedAt ?? c.createdAt).getTime();
    return {
      id: c.id,
      title: c.title,
      summary: c.summary,
      url: c.url,
      sourceName: c.sourceName,
      displayDate: cardDateFmt.format(ts),
      ts,
    };
  });

  // eslint-disable-next-line react-hooks/purity -- request-time value on a force-dynamic page
  const todayTs = Date.now();
  const rangeMin = cases.length ? Math.min(...cases.map((c) => c.ts)) : todayTs;
  const rangeMax = Math.max(todayTs, ...cases.map((c) => c.ts));
  const minYear = Number(yearFmt.format(rangeMin));
  const maxYear = Number(yearFmt.format(rangeMax));
  const yearTicks: { ts: number; label: string }[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    yearTicks.push({ ts: Date.UTC(y, 0, 1), label: String(y) });
  }

  const timelineProps: TimelineProps = {
    cases,
    todayTs,
    rangeMin,
    rangeMax,
    yearTicks,
    rangeStartLabel: shortFmt.format(rangeMin),
    rangeEndLabel: shortFmt.format(rangeMax),
  };

  return (
    <>
      <PageHeader
        eyebrow="ABUSE LOG"
        title="Reported cases of abuse"
        description="Documented misuse of license plate reader data. Each case links to its source. New reports are scanned daily and reviewed before publication."
      />

      <section className="relative">
        <HudBackdrop />
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-20 sm:px-6 lg:px-8">
          <AbuseTimeline {...timelineProps} />
        </div>
      </section>
    </>
  );
}
