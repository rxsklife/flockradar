'use client';

import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import HudBackdrop from '@/components/HudBackdrop';
import Reveal from '@/components/Reveal';

export default function CorrectPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);

    const res = await fetch('/api/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setSubmitted(true);
      setError('');
    } else {
      const err = await res.json();
      setError(err.error || 'Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Corrections"
        title="Request a Correction"
        description="If you think something on FlockRadar is wrong, tell us. We reply within 72 hours and finish the review within 14 days."
      />

      <section className="relative overflow-hidden">
        <HudBackdrop />
        <div className="relative mx-auto max-w-lg px-4 pt-20 pb-20 sm:px-6 lg:px-8">
          <Reveal delay={120}>
            <div className="hud-card hud-scanlines card-lift rounded-md border border-navy-700 bg-navy-900 p-6 shadow-lg">
            <div className="hud-header-strip">
              <span className="hud-led hud-led-warn" aria-hidden="true" />
              <span className="mono-data">FORM // CORRECTION</span>
            </div>
            {submitted ? (
              <div className="rounded-lg border border-green-500/40 bg-green-950/60 p-6 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-10 w-10 text-green-400" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m8 12 3 3 5-6" />
                </svg>
                <p className="mt-3 font-semibold text-green-400">Correction request received</p>
                <p className="mt-2 text-sm text-green-400">
                  We will review your request and respond within 72 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="rounded bg-red-950/60 p-3 text-sm text-red-400">{error}</div>}

                <div>
                  <label className="block text-sm font-medium text-steel-200">
                    Entity or agency name <span className="text-radar-400">*</span>
                  </label>
                  <input
                    name="entityName"
                    required
                    className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm transition-colors focus:border-radar-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-steel-200">
                    What needs to be corrected? <span className="text-radar-400">*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm transition-colors focus:border-radar-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-steel-200">Your email (optional)</label>
                  <input
                    name="contactEmail"
                    type="email"
                    className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm transition-colors focus:border-radar-500"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                >
                  {'>'} submit_correction
                </button>
              </form>
            )}
          </div>
        </Reveal>
        </div>
      </section>
    </>
  );
}
