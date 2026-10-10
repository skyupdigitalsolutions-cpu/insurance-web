import Link from 'next/link';
import { SITE } from '@/lib/site';
import { Logo } from './Logo';

const COLUMNS = [
  { title: 'Product', links: [{ href: '/features', label: 'Features' }, { href: '/pricing', label: 'Pricing' }, { href: '/signup', label: 'Start free trial' }, { href: '/login', label: 'Log in' }] },
  { title: 'Company', links: [{ href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' }] },
  { title: 'Legal', links: [{ href: '/legal/privacy', label: 'Privacy policy' }, { href: '/legal/terms', label: 'Terms of use' }, { href: '/legal/disclaimer', label: 'Disclaimer' }] },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white text-muted">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="dark" />
          <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed">Software for insurance advisors in India. We do not sell insurance or give insurance advice.</p>
          <p className="mt-6 text-[15px]">
            <a className="hover:text-blue-deep" href={`mailto:${SITE.email}`}>{SITE.email}</a><br />
            <a className="hover:text-blue-deep" href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a><br />
            {SITE.address}
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h2 className="font-display text-[15px] font-semibold text-ink">{c.title}</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              {c.links.map((l) => <li key={l.href}><Link className="hover:text-blue-deep" href={l.href}>{l.label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-6 text-[13px] text-[#7a879b] sm:px-8 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. {SITE.registration}</p>
          <p>A software platform for advisors. Insurance products are offered by licensed insurers through registered advisors.</p>
        </div>
      </div>
    </footer>
  );
}
