'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function MapAwareFooter() {
  const pathname = usePathname();
  const isMap = pathname?.startsWith('/map');

  if (isMap) {
    return (
      <div className="hidden md:block">
        <Footer />
      </div>
    );
  }

  return <Footer />;
}
