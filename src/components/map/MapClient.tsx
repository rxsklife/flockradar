'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-navy-950">
      <p className="text-steel-400">Loading map…</p>
    </div>
  ),
});

export default function MapClient() {
  return <MapView />;
}
