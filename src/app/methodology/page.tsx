import type { Metadata } from 'next';
import { readContentFile, parseSections } from '@/lib/content';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';
import ContentBlocks from '@/components/ContentBlocks';

export const metadata: Metadata = {
  title: 'Methodology | FlockRadar',
  description: 'How FlockRadar collects, checks, and publishes license plate reader data.',
};

export default function MethodologyPage() {
  const sections = parseSections(readContentFile('methodology.md'));

  return (
    <>
      <PageHeader
        eyebrow="Methodology"
        title="How we verify the map"
        description="FlockRadar maps what governments have publicly disclosed about license plate reader cameras. This page explains how we collect, check, and publish the data."
      />

      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {sections.map((section, i) => (
              <Reveal key={section.heading} delay={Math.min(i * 70, 280)}>
                <div className="hud-card hud-scanlines card-lift rounded-md border border-navy-700 bg-navy-900 p-6">
                  <div className="hud-header-strip">
                    <span className="hud-led hud-led-info" aria-hidden="true" />
                    <span className="mono-data">DOC.{String(i + 1).padStart(3, '0')}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-radar-300">{section.heading}</h2>
                  <ContentBlocks blocks={section.blocks} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
