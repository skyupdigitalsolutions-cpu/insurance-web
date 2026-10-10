'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge, ErrorNote, Empty, Loading, PageHead, Panel, Segmented } from '@/components/portal/ui';
import { dateTime, dueIn, rupees, date } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { dashboardSummary, listRenewals, pendingActions, recentActivity } from '@/lib/portal/api';
import type { DateRange, PendingAction } from '@/lib/portal/types';

const RANGES = [['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['month', 'This month']] as const;

// Where a pending action opens
function hrefOf(a: PendingAction): string {
  if (!a.target || !a.targetId) return '/app/tasks';
  return { quote: `/app/quotations/${a.targetId}`, payment: `/app/payments/${a.targetId}`, policy: `/app/policies/${a.targetId}`, customer: `/app/customers/${a.targetId}`, task: '/app/tasks' }[a.target];
}

export default function DashboardPage() {
  const { me, can } = useSession();
  const [range, setRange] = useState<DateRange>('month');
  const summary = useQuery({ queryKey: ['dashboard', range], queryFn: () => dashboardSummary(range) });
  const actions = useQuery({ queryKey: ['pending-actions'], queryFn: pendingActions });
  const activity = useQuery({ queryKey: ['activity'], queryFn: recentActivity });
  const renewals = useQuery({ queryKey: ['renewals', '30d'], queryFn: () => listRenewals('30d'), enabled: can('renewal:read') });
  const s = summary.data;
  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const tiles: [string, number | undefined, string][] = [
    ['New leads', s?.newLeads, '/app/leads'], ['Quotations', s?.quotes, '/app/quotations'], ['Policies sold', s?.policies, '/app/policies'],
    ['Renewals due', s?.renewalsDue, '/app/renewals'], ['Active customers', s?.activeCustomers, '/app/customers'], ['Total leads', s?.totalLeads, '/app/leads'],
  ];
  const funnel: [string, number][] = s ? [['Leads', s.totalLeads], ['Contacted', s.contacted], ['Qualified', s.qualified], ['Quoted', s.quotes], ['Accepted', s.accepted], ['Paid', s.paid]] : [];
  const top = Math.max(1, ...funnel.map(([, v]) => v));

  return (
    <>
      <PageHead title={`${greeting}, ${me.name.split(' ')[0]}`} sub="Here is what needs you today." actions={<Segmented label="Period" value={range} options={RANGES} onChange={setRange} />} />
      <ErrorNote error={summary.error} retry={() => void summary.refetch()} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map(([label, v, href]) => (
          <Link key={label} href={href} className={`rounded-2xl bg-white p-4 ring-1 transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(19,33,58,.35)] ${label === 'Renewals due' && (v ?? 0) > 0 ? 'ring-[#f2c98a]' : 'ring-line'}`}>
            <p className="text-[13.5px] text-muted">{label}</p>
            <p className="tabular mt-1 font-display text-[30px] font-semibold leading-none text-ink">{v ?? '–'}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Needs your attention" actions={<Link href="/app/tasks" className="text-[14px] font-semibold text-blue-deep hover:underline">All tasks</Link>}>
          {actions.isLoading ? <Loading /> : actions.data?.length ? (
            <ul className="-my-2 divide-y divide-line">
              {actions.data.map((a) => (
                <li key={a.id}>
                  <Link href={hrefOf(a)} className="flex items-center justify-between gap-4 py-3 hover:text-blue-deep">
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{a.title}</span>
                      <span className="block text-[14px] text-muted">{a.customerName}</span>
                    </span>
                    <Badge tone={a.isOverdue ? 'red' : 'amber'}>{a.dueLabel}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty title="You are all caught up" text="Overdue payments, approvals, documents and follow-ups appear here." />}
        </Panel>

        <Panel title="Lead funnel">
          {s ? (
            <ul className="space-y-2.5">
              {funnel.map(([label, v]) => (
                <li key={label} className="grid grid-cols-[88px_1fr_36px] items-center gap-3 text-[14px]">
                  <span className="text-muted">{label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-paper"><span className="block h-full rounded-full bg-blue" style={{ width: `${(v / top) * 100}%` }} /></span>
                  <span className="tabular text-right font-semibold text-ink">{v}</span>
                </li>
              ))}
            </ul>
          ) : <Loading />}
        </Panel>

        {can('renewal:read') && (
          <Panel title="Renewals in the next 30 days" actions={<Link href="/app/renewals" className="text-[14px] font-semibold text-blue-deep hover:underline">See all</Link>}>
            {renewals.isLoading ? <Loading /> : renewals.data?.length ? (
              <ul className="-my-2 divide-y divide-line">
                {renewals.data.slice(0, 6).map((r) => (
                  <li key={r.id}>
                    <Link href={`/app/renewals/${r.id}`} className="flex items-center justify-between gap-4 py-3">
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink">{r.customerName}</span>
                        <span className="block truncate text-[14px] text-muted">{r.productName} · {r.companyName} · {rupees(r.premium)}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[14px] text-ink">{date(r.dueDate)}</span>
                        <span className={`block text-[13px] ${r.daysLeft <= 7 ? 'font-semibold text-[#94590a]' : 'text-muted'}`}>{dueIn(r.daysLeft)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <Empty title="No renewals due" text="Policies due in the next 30 days will appear here." />}
          </Panel>
        )}

        <Panel title="Recent activity">
          {activity.isLoading ? <Loading /> : activity.data?.length ? (
            <ol className="-my-2 divide-y divide-line">
              {activity.data.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-3 text-[14.5px]">
                  <span className="text-ink">{a.text}</span>
                  <span className="whitespace-nowrap text-[13px] text-muted">{dateTime(a.time)}</span>
                </li>
              ))}
            </ol>
          ) : <Empty title="Nothing yet" text="Leads, quotations and payments you work on will show up here." />}
        </Panel>
      </div>
    </>
  );
}
