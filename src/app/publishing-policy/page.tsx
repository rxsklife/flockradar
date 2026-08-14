import type { Metadata } from 'next';
import { readContentFile, parseSections } from '@/lib/content';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';
import ContentBlocks from '@/components/ContentBlocks';

export const metadata: Metadata = {
  title: 'Publishing Policy | FlockRadar',
  description:
    'What FlockRadar publishes, what it never publishes, and how to request a correction.',
};

export default function PublishingPolicyPage() {
  const sections = parseSections(readContentFile('publishing-policy.md'));

  return (
    <>
      <PageHeader
        eyebrow="Publishing Policy"
        title="What we publish, and what we never will"
        description="This policy explains what FlockRadar publishes and what it never publishes. It exists so the project stays accurate, defensible, and safe for everyone who contributes."
      />

      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {sections.map((section, i) => (
              <Reveal key={section.heading} delay={Math.min(i * 70, 280)}>
                <div className="hud-card hud-scanlines card-lift rounded-md border border-navy-700 bg-navy-900 p-6">
                  <div className="hud-header-strip">
                    <span className="hud-led hud-led-warn" aria-hidden="true" />
                    <span className="mono-data">POL.{String(i + 1).padStart(3, '0')}</span>
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
