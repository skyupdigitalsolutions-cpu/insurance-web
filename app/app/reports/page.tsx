'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/components/portal/session';
import { ErrorNote, Loading, PageHead, Panel, UpgradeNote } from '@/components/portal/ui';
import { kpiReport } from '@/lib/portal/api';

function KpiCard({ label, value, sub, color, href }: { label: string; value: string | number; sub?: string; color: string; href: string }) {
  return (
    <Link href={href} className={`rounded-2xl bg-white ring-1 ring-line p-5 flex flex-col gap-1 border-t-4 ${color} hover:shadow-md hover:ring-blue/30 transition-all group cursor-pointer no-print-link`}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-muted uppercase tracking-wide">{label}</p>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue/10 text-blue group-hover:bg-blue group-hover:text-white transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </div>
      <p className="font-display text-[32px] font-semibold leading-none text-ink">{value}</p>
      {sub && <p className="text-[13px] text-muted">{sub}</p>}
    </Link>
  );
}

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-blue px-4 py-2 text-[14px] font-semibold text-white hover:bg-blue-deep transition-colors no-print"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
      </svg>
      Download PDF
    </button>
  );
}

export default function ReportsPage() {
  const { has } = useSession();
  const report = useQuery({ queryKey: ['kpis'], queryFn: kpiReport, enabled: has('reports') });
  if (!has('reports')) return <><PageHead title="Reports" /><UpgradeNote feature="Reports" /></>;
  const r = report.data;
  const top = Math.max(1, ...(r?.funnel.map((f) => f.value) ?? [1]));

  const get     = (lbl: string) => r?.funnel.find((f) => f.label.toLowerCase() === lbl.toLowerCase())?.value ?? 0;
  const getRate = (lbl: string) => r?.rates.find((k) => k.label.toLowerCase().includes(lbl.toLowerCase()))?.value ?? '—';

  const totalLeads     = get('Leads')    || (r?.funnel[0]?.value ?? 0);
  const totalContacted = get('Contacted') || (r?.funnel[1]?.value ?? 0);
  const totalQualified = get('Qualified') || (r?.funnel[2]?.value ?? 0);
  const totalPolicies  = get('Policies') || (r?.funnel[r?.funnel.length - 1]?.value ?? 0);
  const contactRate    = getRate('contact');
  const qualRate       = getRate('qualification');
  const acceptRate     = getRate('acceptance');
  const paymentRate    = getRate('payment');

  return (
    <>
      {/* Print-only header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Insurance Advisor — Reports</h1>
        <p className="text-sm text-gray-500">Printed on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <PageHead
        back={{ href: '/app', label: 'Dashboard' }}
        title="Reports"
        sub="Your whole business since you started. Click any card to go to that section."
        actions={<PrintButton />}
      />

      <ErrorNote error={report.error} retry={() => void report.refetch()} />
      {!r ? <Loading /> : (
        <div className="space-y-6">

          {/* Row 1 — Volume KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="Total Leads"     value={totalLeads}     sub="All time"                  color="border-blue-400"   href="/app/leads" />
            <KpiCard label="Contacted"       value={totalContacted} sub={`Rate: ${contactRate}`}    color="border-indigo-400" href="/app/leads?status=CONTACTED" />
            <KpiCard label="Qualified"       value={totalQualified} sub={`Rate: ${qualRate}`}        color="border-violet-400" href="/app/leads?status=QUALIFIED" />
            <KpiCard label="Policies Issued" value={totalPolicies}  sub="Converted to policy"       color="border-green-400"  href="/app/policies" />
          </div>

          {/* Row 2 — Rate KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="Contact Rate"    value={contactRate}  sub="Contacted ÷ Leads"           color="border-sky-400"    href="/app/leads" />
            <KpiCard label="Qualify Rate"    value={qualRate}     sub="Qualified ÷ Contacted"        color="border-amber-400"  href="/app/leads" />
            <KpiCard label="Acceptance Rate" value={acceptRate}   sub="Accepted ÷ Quoted"            color="border-orange-400" href="/app/quotations" />
            <KpiCard label="Payment Rate"    value={paymentRate}  sub="Paid ÷ Accepted"              color="border-rose-400"   href="/app/payments" />
          </div>

          {/* Funnel + Rates */}
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="From lead to policy">
              <ul className="space-y-3">
                {r.funnel.map((f) => (
                  <li key={f.label} className="grid grid-cols-[120px_1fr_48px] items-center gap-3 text-[14.5px]">
                    <span className="text-muted">{f.label}</span>
                    <span className="h-3 overflow-hidden rounded-full bg-paper">
                      <span className="block h-full rounded-full bg-blue" style={{ width: `${(f.value / top) * 100}%` }} />
                    </span>
                    <span className="tabular text-right font-semibold">{f.value}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Rates">
              <dl className="divide-y divide-line">
                {[...r.rates, ...r.comparison].map((k) => (
                  <div key={k.label} className="py-3">
                    <div className="flex justify-between gap-3">
                      <dt className="font-semibold text-ink">{k.label}</dt>
                      <dd className="tabular font-display text-[20px] font-semibold">{k.value}</dd>
                    </div>
                    <p className="text-[13px] text-muted">{k.formula}</p>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] text-muted">"—" means there is nothing to divide by yet.</p>
            </Panel>
          </div>

        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav, aside, header, [data-sidebar] { display: none !important; }
          body { background: white !important; }
          a { text-decoration: none !important; color: inherit !important; }
          .no-print-link { pointer-events: none; }
        }
      `}</style>
    </>
  );
}
