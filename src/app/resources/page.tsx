import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Resources | FlockRadar',
  description:
    'Maps, lookup tools, advocacy groups, and research projects working to keep plate reader surveillance honest and accountable.',
};

interface ResourceLink {
  name: string;
  url: string;
  description: string;
  tag?: string;
}

const mappingProjects: ResourceLink[] = [
  {
    name: 'DeFlock',
    url: 'https://deflock.me',
    description:
      'A community project mapping Flock Safety plate reader cameras, with tools for communities pushing back against surveillance.',
    tag: 'Map',
  },
  {
    name: 'Eyes On Flock',
    url: 'https://eyesonflock.com',
    description:
      'Tracks and analyzes the data Flock Safety publishes on its own transparency portals, including camera deployments and search activity.',
    tag: 'Tracker',
  },
  {
    name: 'Have I Been Flocked?',
    url: 'https://haveibeenflocked.com',
    description:
      'Check whether your license plate has been searched in Flock Safety\'s database.',
    tag: 'Lookup',
  },
  {
    name: 'ALPR.watch',
    url: 'https://alpr.watch',
    description:
      'Watches city meeting agendas across the US for discussions about plate reader cameras, Flock Safety, and facial recognition.',
    tag: 'Tracker',
  },
  {
    name: 'ALPR Watch (alprwatch.org)',
    url: 'https://alprwatch.org',
    description:
      'Maps plate reader cameras worldwide and offers route tools that show how much surveillance coverage you drive through. Data is downloadable.',
    tag: 'Map',
  },
  {
    name: 'Eyes Off CR',
    url: 'https://eyesoffcr.org',
    description:
      'A Cedar Rapids, Iowa campaign against plate reader surveillance. They map cameras, watch council meetings, and file public records requests.',
    tag: 'Campaign',
  },
  {
    name: 'Flock ALPR Toolkit',
    url: 'https://github.com/DeflockYourCity/flock-alpr-toolkit',
    description:
      'Briefings, statistics, and ready-made talking points for city council meetings, so residents can challenge Flock proposals at home.',
    tag: 'Toolkit',
  },
  {
    name: 'DeFlock The USA (Camera Map)',
    url: 'https://deflocktheusa.com/the-map/',
    description:
      'A live map of 128,000+ community-reported cameras, updated hourly. Tap any camera for details: who runs it, which way it faces, and when it was first reported.',
    tag: 'Map',
  },
];

const advocacyOrganizations: ResourceLink[] = [
  {
    name: 'EFF (Electronic Frontier Foundation)',
    url: 'https://www.eff.org',
    description:
      'A nonprofit defending digital privacy and civil liberties. They publish deep research on plate reader surveillance and sue over warrantless tracking.',
  },
  {
    name: 'ACLU (American Civil Liberties Union)',
    url: 'https://www.aclu.org',
    description:
      'Fights surveillance overreach through lawsuits and advocacy. State chapters have challenged Flock deployments across the country.',
  },
  {
    name: 'Fight for the Future',
    url: 'https://www.fightforthefuture.org',
    description:
      'A digital rights group that rallies public opposition to surveillance tech and pushes for technology that serves people.',
  },
  {
    name: 'S.T.O.P. (Surveillance Technology Oversight Project)',
    url: 'https://www.stopspying.org',
    description:
      'Sues over invasive surveillance in New York and beyond, and pushes for laws that limit what the government can deploy.',
  },
  {
    name: 'Institute for Justice',
    url: 'https://ij.org',
    description:
      'A public interest law firm challenging mass, warrantless plate reader surveillance in court, including landmark cases against Flock Safety.',
  },
  {
    name: 'Brennan Center for Justice',
    url: 'https://www.brennancenter.org',
    description:
      'A nonpartisan policy institute studying how surveillance technology affects civil liberties, democracy, and racial justice.',
  },
];

const researchAndPolicy: ResourceLink[] = [
  {
    name: 'EFF Atlas of Surveillance',
    url: 'https://atlasofsurveillance.org',
    description:
      'The dataset behind much of FlockRadar\'s evidence: a searchable record of police surveillance technology across the US, built from public records.',
    tag: 'Data',
  },
  {
    name: 'Oversight & FOIA Guides',
    url: 'https://www.muckrock.com',
    description:
      'MuckRock\'s guides and tools for filing public records requests about plate reader programs in your city. The first step to finding out what your police have deployed.',
    tag: 'Guide',
  },
];

export default function ResourcesPage() {
  return (
    <>
      {}
      <PageHeader
        eyebrow="Resources"
        title="Resources & Allies"
        description="Groups and projects working to keep license plate reader surveillance honest and accountable. Here are the maps, tools, and advocates doing the work."
      />

      {}
      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative">
          {}
          <section className="mx-auto max-w-5xl px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-1 text-xl font-bold text-steel-100">Mapping &amp; Transparency Projects</h2>
          <p className="mb-6 text-sm text-steel-400">
            Other projects tracking plate reader cameras, plus tools to find out what your city
            has deployed.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {mappingProjects.map((r, i) => (
            <Reveal key={r.url} delay={Math.min(i * 60, 240)}>
              <ResourceCard resource={r} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-1 text-xl font-bold text-steel-100">
            Organizations Fighting for Your Privacy
          </h2>
          <p className="mb-6 text-sm text-steel-400">
            National organizations working to stop surveillance that runs unchecked.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {advocacyOrganizations.map((r, i) => (
            <Reveal key={r.url} delay={Math.min(i * 60, 240)}>
              <ResourceCard resource={r} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {}
      <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="mb-1 text-xl font-bold text-steel-100">Research &amp; Data</h2>
          <p className="mb-6 text-sm text-steel-400">
            Datasets and guides for digging into surveillance in your own community.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {researchAndPolicy.map((r, i) => (
            <Reveal key={r.url} delay={Math.min(i * 60, 240)}>
              <ResourceCard resource={r} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="card-lift relative overflow-hidden rounded-xl border border-navy-600 bg-gradient-to-br from-navy-800 to-navy-900 p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-radar-500/15 blur-3xl"
            />
            <h2 className="text-lg font-bold text-steel-100">Know of another project?</h2>
            <p className="mt-2 text-sm leading-6 text-steel-300">
              Working on a project that tracks or fights plate reader surveillance? Found a useful
              resource we should list? Tell us. The more eyes on these programs, the harder they
              are to hide.
            </p>
            <Link
              href="/submit"
              className="btn-primary mt-4"
            >
              Suggest a resource
            </Link>
          </div>
        </Reveal>
      </section>
        </div>
      </section>
    </>
  );
}

function ResourceCard({ resource, index = 0 }: { resource: ResourceLink; index?: number }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group hud-card hud-scanlines card-lift block h-full rounded-md border border-navy-600 bg-navy-800 p-4 shadow-sm hover:border-radar-500/50 hover:bg-navy-700"
    >
      <div className="flex items-center justify-center gap-2">
        <span className="hud-led hud-led-info hud-led-static" aria-hidden="true" />
        <h3 className="text-center font-semibold text-steel-100 group-hover:text-radar-400">{resource.name}</h3>
        {resource.tag && (
          <span className="mono-data rounded border border-radar-500/30 bg-radar-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-radar-400">
            {resource.tag}
          </span>
        )}
      </div>
      <p className="mt-2 text-center text-sm leading-6 text-steel-300">{resource.description}</p>
      <p className="mt-2 text-center text-xs font-medium text-radar-500 transition-transform duration-200 group-hover:translate-x-0.5">
        {'>'} visit_{String(index).padStart(2, '0')}
      </p>
    </a>
  );
}
