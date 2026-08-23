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
  openGraph: {
    title: 'Abuse Log',
    description:
      'Reported cases of license plate reader misuse.',
    images: [{ url: 'https://flockradar.com/abuse-og.png', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://flockradar.com/abuse-og.png'],
  },
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
  const d = new Date(todayTs);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const dow = d.getUTCDay();

  const timelineProps: TimelineProps = {
    cases: rows,
    boundaries: {
      week: Date.UTC(y, m, d.getUTCDate() - ((dow + 6) % 7)),
      month: Date.UTC(y, m, 1),
      quarter: Date.UTC(y, m - (m % 3), 1),
      year: Date.UTC(y, 0, 1),
    },
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
        <div className="relative mx-auto max-w-4xl px-4 pt-10 pb-24 sm:px-6 lg:px-8">
          <AbuseTimeline {...timelineProps} />
        </div>
      </section>
    </>
  );
}
