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

const cardDateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export default async function AbusePage() {
  const cases = await db
    .select()
    .from(abuseCases)
    .where(eq(abuseCases.status, 'approved'))
    .orderBy(desc(abuseCases.publishedAt));

  const rows: AbuseCaseRow[] = cases.map((c) => {
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

  const timelineProps: TimelineProps = {
    cases: rows,
    todayTs,
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
        <div className="relative mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
          <AbuseTimeline {...timelineProps} />
        </div>
      </section>
    </>
  );
}
