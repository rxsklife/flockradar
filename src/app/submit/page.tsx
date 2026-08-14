import type { Metadata } from 'next';
import SubmissionForm from '@/components/forms/SubmissionForm';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Submit a Tip | FlockRadar',
  description:
    'Share a public record about license plate reader cameras in your town. Every submission is checked before publication.',
};

export default function SubmitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Submit a Tip"
        title="Found a public record? Share it."
        description="Found a public record about license plate reader cameras in your town? Share it here. Our research team reviews every submission before it is published."
      />

      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative mx-auto max-w-lg px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          <Reveal delay={120}>
            <div className="hud-card hud-scanlines card-lift rounded-md border border-navy-700 bg-navy-900 p-6 shadow-lg">
            <div className="hud-header-strip">
              <span className="hud-led hud-led-ok" aria-hidden="true" />
              <span className="mono-data">FORM // SUBMIT_TIP</span>
            </div>
            <SubmissionForm />
          </div>
        </Reveal>
        </div>
      </section>
    </>
  );
}
