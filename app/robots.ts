import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// The workspace pages (login, dashboard …) are private and kept out of search results
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/app/', '/login'] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
