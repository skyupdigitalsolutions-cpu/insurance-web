'use client';

// Portal frame: sidebar navigation (filtered by permission and plan), top bar with the user, page area.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { LogoMark } from '@/components/site/Logo';
import type { FeatureKey } from '@/lib/portal/types';
import { useSession } from './session';

type Item = { href: string; label: string; perm?: string; feature?: FeatureKey; icon: string };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: '', items: [{ href: '/app', label: 'Dashboard', perm: 'dashboard:read', icon: 'M4 13h6V4H4zm10 7h6v-9h-6zM4 20h6v-4H4zm10-11h6V4h-6z' }] },
  { title: 'Sell', items: [
    { href: '/app/leads', label: 'Leads', perm: 'lead:read', icon: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 8v6m3-3h-6' },
    { href: '/app/customers', label: 'Customers', perm: 'customer:read', icon: 'M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm12 9v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
    { href: '/app/products', label: 'Products', perm: 'product:read', icon: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18M4 7.5l8 4.5 8-4.5' },
    { href: '/app/quotations', label: 'Quotations', perm: 'quotation:read', feature: 'quotes', icon: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6zm0 0v6h6M8 13h8M8 17h5' },
    { href: '/app/payments', label: 'Payments', perm: 'payment:read', icon: 'M3 7h18v10H3zM3 11h18M7 15h3' },
    { href: '/app/policies', label: 'Policies', perm: 'policy:read', icon: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zm-3 9l2 2 4-4' },
  ] },
  { title: 'Follow up', items: [
    { href: '/app/renewals', label: 'Renewals', perm: 'renewal:read', feature: 'renewals', icon: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7' },
    { href: '/app/tasks', label: 'Tasks', perm: 'task:read', icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9' },
    { href: '/app/referrals', label: 'Referrals', perm: 'referral:read', icon: 'M8 12h8m-4-4l4 4-4 4M4 4v16' },
    { href: '/app/messages', label: 'Messages', perm: 'communication:send', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
    { href: '/app/autodial', label: 'Autodial', perm: 'lead:read', feature: 'autodial', icon: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z' },
  ] },
  { title: 'Business', items: [
    { href: '/app/reports', label: 'Reports', perm: 'report:read', feature: 'reports', icon: 'M4 20V10m6 10V4m6 16v-7m4 7H2' },
    { href: '/app/team', label: 'Team', perm: 'user:manage', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0' },
    { href: '/app/subscription', label: 'Subscription', perm: 'dashboard:read', icon: 'M20 12V8H4v12h9M4 8l2-4h12l2 4M17 17l2 2 3-4' },
  ] },
];

const Icon = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { can } = useSession();
  return (
    <nav aria-label="Workspace" className="space-y-5">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => !i.perm || can(i.perm));
        if (!items.length) return null;
        return (
          <div key={g.title || 'main'}>
            {g.title && <p className="mb-1.5 px-3 text-[12.5px] font-semibold text-[#8a97ab]">{g.title}</p>}
            <ul className="space-y-0.5">
              {items.map((i) => {
                const active = i.href === '/app' ? path === '/app' : path.startsWith(i.href);
                return (
                  <li key={i.href}>
                    <Link href={i.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] transition-colors ${active ? 'bg-mist font-semibold text-blue-deep' : 'text-[#43526b] hover:bg-paper hover:text-ink'}`}>
                      <Icon d={i.icon} />{i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function PlanChip() {
  const { sub } = useSession();
  if (!sub) return null;
  const label = sub.status === 'TRIAL' ? `Trial · ${sub.daysLeft} days left` : sub.status === 'EXPIRED' ? 'Plan expired' : `${sub.plan.name} plan`;
  return (
    <Link href="/app/subscription" className={`hidden rounded-full px-3 py-1 text-[13px] font-semibold sm:inline-block ${sub.status === 'EXPIRED' ? 'bg-[#fde9eb] text-[#b42335]' : sub.status === 'TRIAL' ? 'bg-[#fdf0db] text-[#94590a]' : 'bg-mist text-blue-deep'}`}>{label}</Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { me, logout } = useSession();
  const path = usePathname();
  const [menuOn, setMenuOn] = useState<string | null>(null); // the menu belongs to the page it was opened on
  const [userOpen, setUserOpen] = useState(false);
  const menu = menuOn === path;
  const initials = me.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-paper">
      <a href="#portal-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-white px-3 py-5 lg:flex">
        <Link href="/app" className="mb-6 flex items-center gap-2.5 px-3 font-display text-[17px] font-semibold text-ink"><LogoMark size={26} />Insurance Advisor</Link>
        <div className="flex-1 overflow-y-auto"><Nav /></div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <button type="button" className="rounded-lg p-2 text-ink lg:hidden" aria-expanded={menu} aria-controls="portal-menu" onClick={() => setMenuOn(menu ? null : path)}>
            <span className="sr-only">{menu ? 'Close menu' : 'Open menu'}</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          </button>
          <Link href="/app" className="lg:hidden" aria-label="Dashboard"><LogoMark size={28} /></Link>
          <span className="flex-1" />
          <PlanChip />
          <div className="relative">
            <button type="button" aria-expanded={userOpen} aria-haspopup="menu" onClick={() => setUserOpen(!userOpen)} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-paper">
              <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-blue font-display text-[14px] font-semibold text-white">{initials}</span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[14px] font-semibold text-ink">{me.name}</span>
                <span className="block text-[12.5px] text-muted">{me.roleName}</span>
              </span>
            </button>
            {userOpen && (
              <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(19,33,58,.4)] ring-1 ring-line" onMouseLeave={() => setUserOpen(false)}>
                <Link role="menuitem" href="/app/settings" onClick={() => setUserOpen(false)} className="block rounded-lg px-3 py-2 text-[14.5px] text-ink hover:bg-paper">Account and password</Link>
                <button role="menuitem" type="button" onClick={() => void logout()} className="block w-full rounded-lg px-3 py-2 text-left text-[14.5px] text-[#b42335] hover:bg-[#fdf2f3]">Log out</button>
              </div>
            )}
          </div>
        </header>
        {menu && (
          <div id="portal-menu" className="border-b border-line bg-white px-3 py-4 lg:hidden"><Nav onNavigate={() => setMenuOn(null)} /></div>
        )}
        <main id="portal-main" className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
