import Link from 'next/link';

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3.5l10 3.8v7.4c0 6.2-4.2 11.5-10 13.4C10.2 26.2 6 20.9 6 14.7V7.3l10-3.8z" fill="#3a75c4" />
      <path d="M16 3.5l10 3.8v7.4c0 6.2-4.2 11.5-10 13.4V3.5z" fill="#5d8fd6" />
      <path d="M11.3 15.4l3.3 3.3 6.2-6.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ tone = 'dark' }: { tone?: 'light' | 'dark' }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 font-display text-[19px] font-semibold tracking-tight ${tone === 'light' ? 'text-white' : 'text-ink'}`}>
      <LogoMark />
      Insurance Advisor
    </Link>
  );
}
