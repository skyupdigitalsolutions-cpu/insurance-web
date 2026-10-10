import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'white' | 'ghost-light';
const styles: Record<Variant, string> = {
  // Brand blue for the one main action on a screen
  primary: 'bg-blue text-white hover:bg-blue-deep shadow-[0_12px_30px_-12px_rgba(58,117,196,.75)]',
  secondary: 'bg-white text-ink ring-1 ring-line hover:ring-blue/40 hover:text-blue-deep',
  // On the blue band
  white: 'bg-white text-blue-deep hover:bg-mist',
  'ghost-light': 'text-white ring-1 ring-white/40 hover:bg-white/10',
};

export function ButtonLink({ href, variant = 'primary', children, className = '' }: { href: string; variant?: Variant; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[15px] font-semibold transition-colors ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}
