'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV } from '@/lib/site';
import { Logo } from './Logo';

// Transparent at the top of the page, white with a hairline once the page scrolls
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  // The menu belongs to the page it was opened on, so it closes by itself after navigating
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${scrolled || open ? 'bg-white/90 shadow-[0_1px_0_#dce4ef] backdrop-blur-md' : 'bg-transparent'}`}>
      <nav className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8" aria-label="Main">
        <Logo tone="dark" />
        <ul className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={path === n.href ? 'page' : undefined}
                className={`text-[15px] transition-colors ${path === n.href ? 'font-semibold text-blue-deep' : 'text-muted hover:text-ink'}`}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="px-3 py-2 text-[15px] text-ink hover:text-blue-deep">Log in</Link>
          <Link href="/signup" className="rounded-full bg-blue px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-blue-deep">Start free trial</Link>
        </div>
        <button type="button" className="rounded-lg p-2 text-ink md:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpenOn(open ? null : path)}>
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-line bg-white px-5 pb-6 md:hidden">
          <ul className="flex flex-col py-2">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="block py-3 text-lg text-ink">{n.label}</Link></li>
            ))}
            <li><Link href="/login" className="block py-3 text-lg text-muted">Log in</Link></li>
          </ul>
          <Link href="/signup" className="block rounded-full bg-blue py-3.5 text-center font-semibold text-white">Start free trial</Link>
        </div>
      )}
    </header>
  );
}
