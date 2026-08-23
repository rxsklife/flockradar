import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/db';
import { entities, locations, sources, abuseCases } from '@/db/schema';
import { count, desc, eq, sql } from 'drizzle-orm';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import LiveFeed from '@/components/LiveFeed';

const valueProps = [
  {
    id: 'SYS.AGENT.001',
    title: 'Source-First',
    body: 'Every entry links to the public record behind it: a council agenda, a contract, a policy, or an official announcement.',
    led: 'hud-led-ok',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 15h6M9 11h2" />
      </svg>
    ),
  },
  {
    id: 'SYS.AGENT.002',
    title: 'We Show What We Know',
    body: 'We mark when we know the exact camera location and when we only know a program exists. No public record found does not mean no cameras.',
    led: 'hud-led-warn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  },
  {
    id: 'SYS.AGENT.003',
    title: 'Open and Correctable',
    body: 'Anyone can submit a tip, ask for a correction, or download the data. These records belong to you.',
    led: 'hud-led-info',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
];

let communityCameraCount: number | null = null;
function getCommunityCameraCount(): number {
  if (communityCameraCount !== null) return communityCameraCount;
  try {
    const p = path.join(process.cwd(), 'public', 'community-cameras.json');
    const raw = fs.readFileSync(p, 'utf8');


    const count = (raw.match(/\[/g) ?? []).length - 1;
    communityCameraCount = Math.max(count, 0);
  } catch {
    communityCameraCount = 0;
  }
  return communityCameraCount;
}

async function getStats() {
  const [entityCount, stateCount, locationCount, sourceCount] = await Promise.all([
    db.select({ value: count() }).from(entities),
    db.select({ value: count(sql`DISTINCT ${entities.state}`) }).from(entities),
    db.select({ value: count() }).from(locations).where(eq(locations.publicVisible, true)),
    db.select({ value: count() }).from(sources),
  ]);

  return {
    entities: entityCount[0]?.value ?? 0,
    states: stateCount[0]?.value ?? 0,
    locations: locationCount[0]?.value ?? 0,
    sources: sourceCount[0]?.value ?? 0,
    communityCameras: getCommunityCameraCount(),
  };
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stats = await getStats();
  const abuseCasesList = await db
    .select()
    .from(abuseCases)
    .where(eq(abuseCases.status, 'approved'))
    .orderBy(desc(abuseCases.publishedAt))
    .limit(4);

  return (
    <>
      <section className="relative flex min-h-[calc(100svh-102px)] items-center justify-center overflow-hidden sm:min-h-[calc(100vh-102px)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static hero art */}
        <img
          src="/hero.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right lg:object-center"
          width={2048}
          height={1152}
          draggable={false}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-950/55 to-navy-950"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radar-500/10 blur-3xl"
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 sm:py-16 lg:px-8 [@media(max-height:830px)]:sm:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="eyebrow eyebrow-term justify-center mono-data">{'// '}OPEN_SOURCE ALPR TRANSPARENCY</p>
            </Reveal>

            <Reveal delay={80}>
              <div className="hud-frame relative mt-5 rounded-md border border-navy-600/60 bg-navy-900/55 px-4 py-2 text-left shadow-lg backdrop-blur-sm sm:mt-6 sm:px-8 sm:py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="mono-data flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-steel-400 sm:text-xs">
                    <span className="hud-led hud-led-ok" aria-hidden="true" />
                    STATUS: <span className="font-semibold text-radar-300">ONLINE</span>
                  </p>
                  <p className="mono-data hidden text-[10px] uppercase tracking-[0.18em] text-steel-500 sm:block">
                    FLOCKRADAR
                  </p>
                </div>
                <h1 className="font-chakra mt-2 text-center text-[1.5rem] leading-tight font-bold tracking-tight text-steel-100 sm:mt-5 sm:text-4xl">
                  Every marker is{' '}
                  <span className="font-marker inline-block -rotate-2 text-[1.12em] leading-none text-radar-300">
                    evidence-backed
                  </span>
                  , status-labeled, & source-linked.
                </h1>
                <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
                  {[
                    { label: 'Agencies mapped', value: stats.entities },
                    { label: 'States covered', value: stats.states },
                    { label: 'Public records', value: stats.sources },
                  ].map((chip) => (
                    <div
                      key={chip.label}
                      className="rounded border border-navy-600/60 bg-navy-950/60 px-1 py-1 text-center sm:py-2"
                    >
                      <p className="font-digital text-base font-bold tracking-tight text-radar-400 sm:text-2xl">
                        <CountUp value={chip.value} />
                      </p>
                      <p className="mono-data mt-1 text-[8px] uppercase tracking-wide text-steel-400 sm:text-[10px]">
                        {chip.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <p className="mx-auto mt-4 max-w-[32rem] text-sm leading-6 text-steel-200 sm:mt-6 sm:max-w-none sm:text-base sm:leading-7 [@media(max-height:800px)]:hidden">
                FlockRadar documents publicly disclosed ALPR and Flock Safety deployments across the
                United States. In addition to crowd-sourced sighting reports, every point on our map is tied
                directly to a verifiable public record: a contract, council agenda, policy document, or
                official disclosure.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-4 flex items-center justify-center gap-3 sm:mt-8 sm:gap-4">
                <Link href="/map" className="btn-primary glow-pulse px-4! py-2.5! sm:px-6! sm:py-3!">
                  Explore the Map
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="hidden h-4 w-4 sm:block" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/methodology" className="btn-secondary px-4! py-2.5! sm:px-6! sm:py-3!">
                  How It Works
                </Link>
              </div>
              <Link
                href="/resources"
                className="btn-secondary mx-auto mt-3 block w-full max-w-[16rem] px-4! py-2.5! sm:hidden!"
              >
                ALPR Resources
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <LiveFeed />

      <section className="relative bg-navy-950 pt-20 pb-14">
        {/* eslint-disable-next-line @next/next/no-img-element -- static bg art */}
        <img
          src="/bg-alpr.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-40"
          width={2048}
          height={1152}
          draggable={false}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/80 to-navy-950"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Reveal>
              <p className="eyebrow eyebrow-term justify-center mono-data">{'// '}KNOW THE TECHNOLOGY</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-3 text-2xl font-bold text-steel-100 sm:text-3xl">
                What is <span className="gradient-heading">ALPR?</span>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 text-lg leading-8 text-steel-300">
                License plate reader cameras, often called ALPR, photograph every plate that
                drives past and save the time and place of each capture. They sit on roadsides,
                on police cruisers, and on bridges. Across the United States they record millions
                of plates every day.
              </p>
            </Reveal>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Reveal>
              <div className="hud-card hud-scanlines card-lift h-full rounded-md border border-navy-700 bg-navy-800 p-5 shadow-sm">
                <div className="hud-header-strip">
                  <span className="hud-led hud-led-info" aria-hidden="true" />
                  <span className="mono-data">MOD.001 // SYSTEM</span>
                </div>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-radar-500/30 bg-radar-500/10 text-radar-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </div>
                <h3 className="mt-3 text-center font-semibold text-steel-100">What they are</h3>
                <p className="mt-2 text-center text-sm leading-6 text-steel-300">
                  These cameras photograph every plate that goes by, not just cars on a watch list.
                  Each capture saves the plate, a photo, the time, and the exact spot. Over time
                  that builds a searchable record of where cars, and the people in them, have been.
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="hud-card hud-scanlines card-lift h-full rounded-md border border-navy-700 bg-navy-800 p-5 shadow-sm">
                <div className="hud-header-strip">
                  <span className="hud-led hud-led-ok" aria-hidden="true" />
                  <span className="mono-data">MOD.002 // INTENT</span>
                </div>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-radar-500/30 bg-radar-500/10 text-radar-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <h3 className="mt-3 text-center font-semibold text-steel-100">Their stated goal</h3>
                <p className="mt-2 text-center text-sm leading-6 text-steel-300">
                  Companies sell these cameras as a crime-fighting tool: recover stolen cars, catch
                  wanted drivers, solve hit-and-runs, and speed up AMBER Alerts by flagging plates
                  as they pass.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="hud-card hud-scanlines card-lift h-full rounded-md border border-navy-700 bg-navy-800 p-5 shadow-sm">
                <div className="hud-header-strip">
                  <span className="hud-led hud-led-warn" aria-hidden="true" />
                  <span className="mono-data">MOD.003 // SCOPE</span>
                </div>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-radar-500/30 bg-radar-500/10 text-radar-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                    <path d="M9 11.5 11 13l4-4" />
                    <path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" />
                  </svg>
                </div>
                <h3 className="mt-3 text-center font-semibold text-steel-100">Legitimate uses</h3>
                <p className="mt-2 text-center text-sm leading-6 text-steel-300">
                  Finding stolen cars and missing children is the legitimate core. A plate on a
                  watch list sets off an instant alert. The problem is what happens to every other
                  plate the cameras capture, and who gets to search that data later.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <Reveal>
              <div className="text-center">
                <p className="eyebrow eyebrow-term justify-center mono-data">{'// '}DOCUMENTED, NOT HYPOTHETICAL</p>
                <h3 className="mt-3 text-xl font-bold text-steel-100 sm:text-2xl">
                  Real cases of abuse
                </h3>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {abuseCasesList.map((c, i) => (
                <Reveal key={c.id} delay={i * 100}>
                  <div className="hud-card hud-scanlines card-lift h-full rounded-md border border-navy-700 bg-navy-900 p-5 shadow-sm">
                    <div className="hud-header-strip">
                      <span className="hud-led hud-led-warn" aria-hidden="true" />
                      <span className="mono-data">ABUSE-{c.id.slice(0, 4).toUpperCase()}</span>
                    </div>
                    <h4 className="font-semibold text-steel-100">{c.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-steel-300">{c.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-radar-400 underline decoration-radar-400/40 underline-offset-4 transition-colors hover:text-radar-300"
                      >
                        {c.sourceName} report
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
                      </a>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <a
              href="/abuse"
              className="btn-secondary inline-flex items-center gap-2"
            >
              See more cases
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <Reveal>
              <div className="text-center">
                <p className="eyebrow eyebrow-term justify-center mono-data">{'// '}WHY IT MATTERS</p>
                <h3 className="mt-3 text-xl font-bold text-steel-100 sm:text-2xl">
                  Privacy concerns for Americans
                </h3>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  id: 'FLAG.001',
                  title: 'Mass collection without suspicion',
                  body: 'These cameras record every car that passes. No warrant, no suspicion, no reason at all. If you drive, your plate is in the database.',
                },
                {
                  id: 'FLAG.002',
                  title: 'A map of your life',
                  body: 'Your plate shows where you live, where you work, where you go to church or the doctor. Over months, those records draw a map of your daily life and the people you see.',
                },
                {
                  id: 'FLAG.003',
                  title: 'Shared across agencies',
                  body: 'Camera companies share plate data across city lines, state lines, and even with federal agencies. One camera in your town feeds databases all over the country.',
                },
                {
                  id: 'FLAG.004',
                  title: 'No federal rules',
                  body: 'No federal law controls how long plate data is kept or who can search it. Whether your town keeps records for 30 days or 30 years depends on local policy.',
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 90}>
                  <div className="hud-card hud-scanlines card-lift h-full rounded-md border border-navy-700 bg-navy-900 p-5 shadow-sm">
                    <div className="hud-header-strip">
                      <span className="hud-led hud-led-warn" aria-hidden="true" />
                      <span className="mono-data">{item.id}</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- static icon */}
                        <img
                          src="/privacy-shield.png"
                          alt=""
                          aria-hidden="true"
                          width={20}
                          height={20}
                          className="h-5 w-5 shrink-0 object-contain"
                          draggable={false}
                        />
                        <h4 className="font-semibold text-steel-100">{item.title}</h4>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-steel-300">{item.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={120}>
              <p className="mt-8 text-center text-sm text-steel-400">
                That&apos;s why FlockRadar exists: to show which agencies run these cameras, what
                they tell the public, and what the records actually say.{' '}
                <Link href="/map" className="text-radar-400 underline decoration-radar-400/40 underline-offset-4 transition-colors hover:text-radar-300">
                  Explore the map
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative bg-navy-950 pt-8 pb-20">
        {/* eslint-disable-next-line @next/next/no-img-element -- static bg art */}
        <img
          src="/bg-why.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-35"
          width={2048}
          height={1152}
          draggable={false}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/75 to-navy-950"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Reveal>
              <p className="eyebrow eyebrow-term justify-center mono-data">{'// '}WHY FLOCKRADAR</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-3 text-2xl font-bold text-steel-100 sm:text-3xl">
                Every point comes from a <span className="gradient-heading">public record</span>
              </h2>
            </Reveal>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {valueProps.map((item, i) => (
              <Reveal key={item.title} delay={i * 110}>
                <div className="hud-card hud-scanlines card-lift h-full rounded-md border border-navy-700 bg-navy-800 p-5 shadow-sm">
                  <div className="hud-header-strip">
                    <span className={`hud-led ${item.led}`} aria-hidden="true" />
                    <span className="mono-data">{item.id}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-radar-500/30 bg-radar-500/10 text-radar-400">
                      {item.icon}
                    </div>
                    <h3 className="text-center font-semibold text-steel-100">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-center text-sm leading-6 text-steel-300">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-navy-950 pb-24 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- static bg art */}
        <img
          src="/bg-cta.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 left-0 h-full w-full object-cover object-right-top opacity-45 sm:w-1/2"
          width={2048}
          height={1152}
          draggable={false}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-navy-950/70 via-navy-950/30 to-navy-950 sm:from-navy-950/80 sm:via-navy-950/40 sm:to-navy-950"
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="card-lift relative overflow-hidden rounded-2xl border border-navy-600 bg-gradient-to-br from-navy-800 to-navy-900 px-6 py-12 text-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-radar-500/15 blur-3xl"
              />
              <h2 className="text-2xl font-bold text-steel-100 sm:text-3xl">
                See what&apos;s been disclosed near you
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-steel-300">
                Every point on the map links to a public record you can read. See what your town
                has deployed, check the sources, and tell us when something looks wrong.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/map" className="btn-primary">
                  Open the Map
                </Link>
                <Link href="/resources" className="btn-secondary">
                  Resources &amp; Allies
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
