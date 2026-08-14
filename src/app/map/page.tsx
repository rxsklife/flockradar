import type { Metadata } from 'next';
import MapClient from '@/components/map/MapClient';

export const metadata: Metadata = {
  title: 'Map',
  description:
    'Searchable map of publicly disclosed Flock Safety and ALPR deployments, with evidence links to the public records that disclosed them.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MapPage() {
  return (
    <div className="flex-1 w-full overflow-hidden flex flex-col">
      <MapClient />
    </div>
  );
}
