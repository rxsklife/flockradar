import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://flockradar.com';
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/map`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/methodology`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/publishing-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/submit`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/correct`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
