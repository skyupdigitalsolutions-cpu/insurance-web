import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/instrument-sans/standard.css';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — CRM for insurance advisors in India`, template: `%s — ${SITE.name}` },
  description: SITE.description,
  openGraph: { title: SITE.name, description: SITE.description, type: 'website', locale: 'en_IN', siteName: SITE.name },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = { themeColor: '#f5f8fc' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
