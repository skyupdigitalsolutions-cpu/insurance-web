import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/features', '/pricing', '/about', '/contact', '/signup', '/legal/privacy', '/legal/terms', '/legal/disclaimer'];
  return pages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: 'monthly', priority: p === '' ? 1 : 0.6 }));
}
