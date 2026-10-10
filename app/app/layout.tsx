import type { Metadata } from 'next';
import { PortalProviders } from '@/components/portal/session';
import { Shell } from '@/components/portal/Shell';

// The advisor workspace. Not for search engines.
export const metadata: Metadata = { title: { default: 'Workspace', template: '%s — Insurance Advisor' }, robots: { index: false, follow: false } };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProviders>
      <Shell>{children}</Shell>
    </PortalProviders>
  );
}
