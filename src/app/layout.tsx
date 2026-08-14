import type { Metadata } from 'next';
import { Inter, Fira_Code, Permanent_Marker, Chakra_Petch } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/MapAwareFooter';
import BackToTop from '@/components/BackToTop';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  weight: ['400', '500', '600', '700'],
});
const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  variable: '--font-chakra',
  weight: ['400', '500', '600', '700'],
});
const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  variable: '--font-marker',
  weight: '400',
});
const dseg7 = localFont({
  src: [
    {
      path: '../../node_modules/dseg/fonts/DSEG7-Classic/DSEG7Classic-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/dseg/fonts/DSEG7-Classic/DSEG7Classic-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dseg7',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FlockRadar: Open-Source ALPR Transparency Map',
    template: '%s | FlockRadar',
  },
  description:
    'An evidence-backed map documenting disclosed ALPR and Flock Safety deployments, policies, and contracts across the United States.',
  keywords: ['ALPR', 'Flock Safety', 'license plate reader', 'surveillance', 'transparency', 'public records'],
  openGraph: {
    title: 'FlockRadar: Open-Source ALPR Transparency Map',
    description:
      'Every marker is evidence-backed, status-labeled, source-linked, and time-bounded.',
    type: 'website',
    url: 'https://flockradar.com',
    siteName: 'FlockRadar',
    locale: 'en_US',
    images: [
      {
        url: 'https://flockradar.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlockRadar map of disclosed license plate reader deployments',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlockRadar: Open-Source ALPR Transparency Map',
    description: 'Every marker is evidence-backed, status-labeled, source-linked, and time-bounded.',
    images: ['https://flockradar.com/og-image.png'],
  },
  metadataBase: new URL('https://flockradar.com'),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${firaCode.variable} ${dseg7.variable} ${permanentMarker.variable} ${chakraPetch.variable} ${inter.className} bg-navy-900 text-steel-100 antialiased`}
      >
        <div className="flex min-h-dvh flex-col">
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <BackToTop />
        </div>
      </body>
    </html>
  );
}
