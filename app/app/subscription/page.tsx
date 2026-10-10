'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { date, rupees } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { Badge, Button, Empty, ErrorNote, Loading, Notice, PageHead, Panel, Segmented, Table, Td } from '@/components/portal/ui';
import { getCheckout, listPlans, mySubscription, setAutoRenew, startCheckout } from '@/lib/portal/api';
import type { BillingCycle, Checkout, Invoice, Plan } from '@/lib/portal/types';
import { FEATURE_NAMES } from '@/lib/plans';

const CYCLES = [['monthly', 'Monthly'], ['yearly', 'Yearly (2 months free)']] as const;

const GST_RATE = 0.18;

// ── Invoice PDF Generator ───────────────────────────────────────────────────
function downloadInvoice(invoice: Invoice, orgName: string) {
  const base    = invoice.amount;
  const gst     = invoice.gst;
  const total   = invoice.total;
  const cgst    = Math.round(gst / 2);
  const sgst    = gst - cgst;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #3a75c4; padding-bottom: 20px; }
    .brand { font-size: 22px; font-weight: 700; color: #3a75c4; }
    .brand-sub { font-size: 12px; color: #666; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 20px; font-weight: 700; color: #3a75c4; }
    .invoice-meta p { font-size: 12px; color: #555; margin-top: 2px; }
    .section { margin-bottom: 24px; }
    .section h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 0.5px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #f4f6fb; text-align: left; padding: 8px 12px; font-size: 12px; font-weight: 700; border-bottom: 1px solid #dde; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .amount { text-align: right; }
    .summary { margin-left: auto; width: 280px; margin-top: 16px; }
    .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .summary-row.total { font-weight: 700; font-size: 15px; border-top: 2px solid #111; margin-top: 4px; padding-top: 8px; }
    .gst-note { font-size: 11px; color: #888; margin-top: 4px; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Insurance Advisor</div>
      <div class="brand-sub">Software Subscription Invoice</div>
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p>Invoice No: <strong>${invoice.number}</strong></p>
      <p>Date: ${new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <p><span class="badge">PAID</span></p>
    </div>
  </div>

  <div style="display:flex; gap:40px; margin-bottom:28px;">
    <div class="section" style="flex:1">
      <h3>Billed To</h3>
      <p style="font-weight:600">${orgName}</p>
    </div>
    <div class="section" style="flex:1">
      <h3>Subscription Details</h3>
      <p><strong>Plan:</strong> ${invoice.planName}</p>
      <p><strong>Billing:</strong> ${invoice.cycle === 'monthly' ? 'Monthly' : 'Yearly'}</p>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>HSN/SAC</th><th>Rate</th><th class="amount">Amount (₹)</th></tr></thead>
    <tbody>
      <tr>
        <td>${invoice.planName} Plan — ${invoice.cycle === 'monthly' ? 'Monthly' : 'Annual'} Subscription</td>
        <td>998313</td>
        <td>Base price</td>
        <td class="amount">₹${base.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row"><span>Sub-total</span><span>₹${base.toLocaleString('en-IN')}</span></div>
    <div class="summary-row"><span>CGST @ 9%</span><span>₹${cgst.toLocaleString('en-IN')}</span></div>
    <div class="summary-row"><span>SGST @ 9%</span><span>₹${sgst.toLocaleString('en-IN')}</span></div>
    <div class="summary-row total"><span>Total (incl. 18% GST)</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    <div class="gst-note">SAC 998313 — Software as a Service (SaaS)</div>
  </div>

  <div class="footer">
    This is a computer-generated invoice. Insurance Advisor is a product of your service provider.
  </div>

  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ── GST Breakdown Row ───────────────────────────────────────────────────────
function GstBreakdown({ price }: { price: number }) {
  const base  = price;
  const gst   = Math.round(price * GST_RATE);
  const cgst  = Math.round(gst / 2);
  const sgst  = gst - cgst;
  const total = base + gst;

  return (
    <div className="mt-3 rounded-xl bg-[#f4f6fb] p-3 text-[13px] space-y-1">
      <div className="flex justify-between text-muted"><span>Base price</span><span className="tabular">₹{base.toLocaleString('en-IN')}</span></div>
      <div className="flex justify-between text-muted"><span>CGST @ 9%</span><span className="tabular">₹{cgst.toLocaleString('en-IN')}</span></div>
      <div className="flex justify-between text-muted"><span>SGST @ 9%</span><span className="tabular">₹{sgst.toLocaleString('en-IN')}</span></div>
      <div className="flex justify-between font-semibold text-ink border-t border-line pt-1 mt-1"><span>Total payable</span><span className="tabular">₹{total.toLocaleString('en-IN')}</span></div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const qc = useQueryClient();
  const { me } = useSession();
  const [cycle, setCycle] = useState<BillingCycle>('yearly');
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [showGst, setShowGst] = useState<string | null>(null);

  const sub   = useQuery({ queryKey: ['subscription'], queryFn: mySubscription });
  const plans = useQuery({ queryKey: ['plans'], queryFn: listPlans });
  const status = useQuery({
    queryKey: ['checkout', checkout?.checkoutId], queryFn: () => getCheckout(checkout!.checkoutId), enabled: !!checkout,
    refetchInterval: (q) => (q.state.data?.status === 'PAID' || q.state.data?.status === 'FAILED' ? false : 5000),
  });
  const start = useMutation({ mutationFn: (p: Plan) => startCheckout(p.id, cycle), onSuccess: (c) => { setCheckout(c); window.open(c.url, '_blank', 'noopener'); } });
  const renew = useMutation({ mutationFn: (on: boolean) => setAutoRenew(on), onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }) });
  const paid = status.data?.status === 'PAID';
  useEffect(() => { if (paid) void qc.invalidateQueries({ queryKey: ['subscription'] }); }, [paid, qc]);

  if (sub.isLoading) return <Loading />;
  if (!sub.data) return <ErrorNote error={sub.error} retry={() => void sub.refetch()} />;
  const s = sub.data;
  const tone = s.status === 'ACTIVE' ? 'green' : s.status === 'TRIAL' ? 'amber' : 'red';

  return (
    <>
      <PageHead back={{ href: '/app', label: 'Dashboard' }} title="Subscription" sub="Your plan for this app. Software subscriptions carry 18% GST (CGST 9% + SGST 9%)." />
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[18px] font-semibold">Plans</h2>
            <Segmented label="Billing" value={cycle} options={CYCLES} onChange={setCycle} />
          </div>
          {plans.isLoading ? <Loading /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.data?.filter((p) => p.id !== 'trial').map((p) => {
                const price   = cycle === 'monthly' ? p.monthly : p.yearly;
                const gst     = Math.round(price * GST_RATE);
                const total   = price + gst;
                const current = s.status === 'ACTIVE' && s.plan.id === p.id && s.cycle === cycle;
                const isOpen  = showGst === p.id;
                return (
                  <article key={p.id} className={`rounded-2xl bg-white p-5 ring-1 ${p.popular ? 'ring-2 ring-blue' : 'ring-line'}`}>
                    <h3 className="font-display text-[20px] font-semibold">{p.name}</h3>
                    <p className="text-[14px] text-muted">{p.tagline}</p>
                    <p className="tabular mt-3 font-display text-[30px] font-semibold">
                      {rupees(price)}
                      <span className="ml-1 text-[14px] font-normal text-muted">{cycle === 'monthly' ? 'per month' : 'per year'}</span>
                    </p>
                    {/* GST summary line with toggle */}
                    <button onClick={() => setShowGst(isOpen ? null : p.id)} className="mt-1 text-[13px] text-blue-deep hover:underline text-left">
                      + 18% GST ({rupees(gst)}) · Total {rupees(total)} {isOpen ? '▲' : '▼'}
                    </button>
                    {/* GST breakdown panel */}
                    {isOpen && <GstBreakdown price={price} />}
                    <p className="mt-2 text-[12.5px] text-muted">{p.users === 1 ? '1 user' : `up to ${p.users} users`}</p>
                    {s.isOwner && (
                      <Button className="mt-4 w-full" variant={p.popular ? 'primary' : 'secondary'} disabled={current} busy={start.isPending && start.variables?.id === p.id} onClick={() => start.mutate(p)}>
                        {current ? 'Your plan' : `Choose ${p.name}`}
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invoices table */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-[18px] font-semibold">Invoices</h2>
        <Table
          head={['Invoice', 'Plan', 'Base amount', 'CGST 9%', 'SGST 9%', 'Total', 'Paid on', '']}
          empty={!s.invoices.length && <Empty title="No invoices yet" text="Your first invoice will appear here after your first payment." />}
        >
          {s.invoices.map((inv) => {
            const cgst = Math.round(inv.gst / 2);
            const sgst = inv.gst - cgst;
            return (
              <tr key={inv.id} className="hover:bg-[#f7f8fb] transition-colors">
                <Td className="tabular font-semibold">{inv.number}</Td>
                <Td>{inv.planName}<span className="block text-[12px] text-muted capitalize">{inv.cycle}</span></Td>
                <Td className="tabular">₹{inv.amount.toLocaleString('en-IN')}</Td>
                <Td className="tabular text-muted">₹{cgst.toLocaleString('en-IN')}</Td>
                <Td className="tabular text-muted">₹{sgst.toLocaleString('en-IN')}</Td>
                <Td className="tabular font-semibold">₹{inv.total.toLocaleString('en-IN')}</Td>
                <Td className="whitespace-nowrap text-muted">{date(inv.paidAt)}</Td>
                <Td>
                  <button
                    onClick={() => downloadInvoice(inv, me.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue/10 px-3 py-1.5 text-[12px] font-semibold text-blue-deep hover:bg-blue hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    PDF
                  </button>
                </Td>
              </tr>
            );
          })}
        </Table>
      </div>
    </>
  );
}
