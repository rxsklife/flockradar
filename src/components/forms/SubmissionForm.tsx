'use client';

import { useState, type FormEvent } from 'react';

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export default function SubmissionForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        rightToShareConfirmed: true,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
      setError('');
    } else {
      const err = await res.json();
      setError(err.error || 'Something went wrong. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-500/40 bg-green-950/60 p-6 text-center">
        <p className="font-semibold text-green-400">Thank you for your submission!</p>
        <p className="mt-2 text-sm text-green-400">
          Our research team will review your tip. Nothing gets published automatically; every
          entry is checked against public records.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="rounded bg-red-950/60 p-3 text-sm text-red-400">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-steel-200">
          State <span className="text-radar-400">*</span>
        </label>
        <select
          name="state"
          required
          className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
        >
          <option value="">Select a state...</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-steel-200">City</label>
          <input
            name="city"
            className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-steel-200">County</label>
          <input
            name="county"
            className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-steel-200">Location description</label>
        <input
          name="locationDescription"
          placeholder="General location or intersection (not a home address)"
          className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-steel-400">Do not submit private residential addresses.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-steel-200">
          What did you observe or find?
        </label>
        <textarea
          name="observation"
          rows={3}
          className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-steel-200">
          Type of evidence <span className="text-radar-400">*</span>
        </label>
        <select
          name="evidenceType"
          required
          className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          <option value="official_document">Official document (contract, agenda, policy)</option>
          <option value="official_sign">Official sign or location disclosure</option>
          <option value="photo">Photo of public infrastructure</option>
          <option value="news">News source</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-steel-200">Source URL</label>
        <input
          name="sourceUrl"
          type="url"
          placeholder="https://..."
          className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-steel-200">Date observed or published</label>
        <input
          name="observedDate"
          type="date"
          className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-steel-200">Contact email (optional)</label>
        <input
          name="contactEmail"
          type="email"
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-md border border-navy-600 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-start gap-2">
        <input type="checkbox" required id="confirm" className="mt-1" />
        <label htmlFor="confirm" className="text-sm text-steel-300">
          I confirm I have the right to share this material and it does not contain personal data,
          credentials, or prohibited content.
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
      >
        {'>'} submit_tip
      </button>
    </form>
  );
}
