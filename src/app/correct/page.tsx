import type { Metadata } from 'next';
import CorrectForm from './CorrectForm';

export const metadata: Metadata = {
  title: 'Request a Correction',
  description:
    'If you think something on FlockRadar is wrong, tell us. We reply within 72 hours and finish the review within 14 days.',
};

export default function CorrectPage() {
  return <CorrectForm />;
}
