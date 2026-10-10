'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { date, rupees } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { Badge, Button, Empty, ErrorNote, Loading, Notice, PageHead, Panel, Segmented, Table, Td } from '@/components/portal/ui';
import { getCheckout, listPlans, mySubscription, setAutoRenew, startCheckout } from '@/lib/portal/api';
import type { BillingCycle, Checkout, Plan } from '@/lib/portal/types';
import { FEATURE_NAMES } from '@/lib/plans';

const CYCLES = [['monthly', 'Monthly'], ['yearly', 'Yearly (2 months free)']] as const;

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const { me } = useSession();
  const [cycle, setCycle] = useState<BillingCycle>('yearly');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const sub = useQuery({ queryKey: ['subscription'], queryFn: mySubscription });
  const plans = useQuery({ queryKey: ['plans'], queryFn: listPlans });
  // After opening the payment page, check every 5 seconds until it is paid
  const status = useQuery({ queryKey: ['checkout', checkout?.checkoutId], queryFn: () => getCheckout(checkout!.checkoutId), enabled: !!checkout,
    refetchInterval: (q) => (q.state.data?.status === 'PAID' || q.state.data?.status === 'FAILED' ? false : 5000) });
  const start = useMutation({ mutationFn: (p: Plan) => startCheckout(p.id, cycle), onSuccess: (c) => { setCheckout(c); window.open(c.url, '_blank', 'noopener'); } });
  const renew = useMutation({ mutationFn: (on: boolean) => setAutoRenew(on), onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }) });
  const paid = status.data?.status === 'PAID';
  // Once paid, reload the plan (and the plan chip in the top bar)
  useEffect(() => { if (paid) void qc.invalidateQueries({ queryKey: ['subscription'] }); }, [paid, qc]);

  if (sub.isLoading) return <Loading />;
  if (!sub.data) return <ErrorNote error={sub.error} retry={() => void sub.refetch()} />;
  const s = sub.data;
  const tone = s.status === 'ACTIVE' ? 'green' : s.status === 'TRIAL' ? 'amber' : 'red';

  return (
    <>
      <PageHead title="Subscription" sub="Your plan for this app. Software subscriptions carry 18% GST." />
      {paid && <Notice tone="green">Payment received. Your {status.data?.planName} plan is active.</Notice>}
      {checkout && !paid && <Notice>Complete the payment in the tab that opened. This page updates by itself. <a href={checkout.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open it again</a></Notice>}
      <ErrorNote error={start.error ?? renew.error} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Current plan">
          <p className="font-display text-[26px] font-semibold text-ink">{s.plan.name} <Badge tone={tone}>{s.status === 'TRIAL' ? 'Trial' : s.status === 'ACTIVE' ? 'Active' : 'Expired'}</Badge></p>
          <p className="mt-1 text-muted">{s.status === 'EXPIRED' ? 'Renew to continue using reports, AI and Autodial.' : `${s.status === 'TRIAL' ? 'Trial ends' : 'Renews'} on ${date(s.renewsAt)} · ${s.daysLeft} days left`}</p>
          <ul className="mt-4 grid gap-1.5 text-[14.5px]">{s.features.map((f) => <li key={f}>✓ {FEATURE_NAMES[f] ?? f}</li>)}</ul>
          {s.isOwner && s.status === 'ACTIVE' && (
            <label className="mt-5 flex items-start gap-3 rounded-xl bg-paper p-4 text-[14.5px]">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#3a75c4]" checked={s.autoRenew} disabled={renew.isPending} onChange={(e) => renew.mutate(e.target.checked)} />
              <span><span className="font-semibold text-ink">Remind me with a payment link</span><span className="block text-muted">Three days before the renewal date we SMS you a link for the same plan.</span></span>
            </label>
          )}
          {!s.isOwner && <p className="mt-4 text-[14px] text-muted">Only the account owner can change the plan. You are logged in as {me.name}.</p>}
        </Panel>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-[18px] font-semibold">Plans</h2><Segmented label="Billing" value={cycle} options={CYCLES} onChange={setCycle} /></div>
          {plans.isLoading ? <Loading /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.data?.filter((p) => p.id !== 'trial').map((p) => {
                const price = cycle === 'monthly' ? p.monthly : p.yearly;
                const current = s.status === 'ACTIVE' && s.plan.id === p.id && s.cycle === cycle;
                return (
                  <article key={p.id} className={`rounded-2xl bg-white p-5 ring-1 ${p.popular ? 'ring-2 ring-blue' : 'ring-line'}`}>
                    <h3 className="font-display text-[20px] font-semibold">{p.name}</h3>
                    <p className="text-[14px] text-muted">{p.tagline}</p>
                    <p className="tabular mt-3 font-display text-[30px] font-semibold">{rupees(price)}<span className="ml-1 text-[14px] font-normal text-muted">{cycle === 'monthly' ? 'per month' : 'per year'}</span></p>
                    <p className="tabular text-[13.5px] text-muted">+ 18% GST ({rupees(Math.round(price * 0.18))}) · {p.users === 1 ? '1 user' : `up to ${p.users} users`}</p>
                    {s.isOwner && <Button className="mt-4 w-full" variant={p.popular ? 'primary' : 'secondary'} disabled={current} busy={start.isPending && start.variables?.id === p.id} onClick={() => start.mutate(p)}>{current ? 'Your plan' : `Choose ${p.name}`}</Button>}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <h2 className="mb-3 mt-8 font-display text-[18px] font-semibold">Invoices</h2>
      <Table head={['Invoice', 'Plan', 'Amount', 'GST', 'Total', 'Paid on']} empty={!s.invoices.length && <Empty title="No invoices yet" />}>
        {s.invoices.map((i) => (
          <tr key={i.id}><Td className="tabular font-semibold">{i.number}</Td><Td>{i.planName} ({i.cycle})</Td><Td className="tabular">{rupees(i.amount)}</Td><Td className="tabular">{rupees(i.gst)}</Td><Td className="tabular font-semibold">{rupees(i.total)}</Td><Td>{date(i.paidAt)}</Td></tr>
        ))}
      </Table>
    </>
  );
}
