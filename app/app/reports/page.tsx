'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/components/portal/session';
import { ErrorNote, Loading, PageHead, Panel, UpgradeNote } from '@/components/portal/ui';
import { kpiReport } from '@/lib/portal/api';

export default function ReportsPage() {
  const { has } = useSession();
  const report = useQuery({ queryKey: ['kpis'], queryFn: kpiReport, enabled: has('reports') });
  if (!has('reports')) return <><PageHead title="Reports" /><UpgradeNote feature="Reports" /></>;
  const r = report.data;
  const top = Math.max(1, ...(r?.funnel.map((f) => f.value) ?? [1]));
  return (
    <>
      <PageHead title="Reports" sub="Your whole business since you started. Every rate shows how it is worked out." />
      <ErrorNote error={report.error} retry={() => void report.refetch()} />
      {!r ? <Loading /> : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="From lead to policy">
            <ul className="space-y-3">
              {r.funnel.map((f) => (
                <li key={f.label} className="grid grid-cols-[120px_1fr_48px] items-center gap-3 text-[14.5px]">
                  <span className="text-muted">{f.label}</span>
                  <span className="h-3 overflow-hidden rounded-full bg-paper"><span className="block h-full rounded-full bg-blue" style={{ width: `${(f.value / top) * 100}%` }} /></span>
                  <span className="tabular text-right font-semibold">{f.value}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Rates">
            <dl className="divide-y divide-line">
              {[...r.rates, ...r.comparison].map((k) => (
                <div key={k.label} className="py-3">
                  <div className="flex justify-between gap-3"><dt className="font-semibold text-ink">{k.label}</dt><dd className="tabular font-display text-[20px] font-semibold">{k.value}</dd></div>
                  <p className="text-[13px] text-muted">{k.formula}</p>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[13px] text-muted">“—” means there is nothing to divide by yet.</p>
          </Panel>
        </div>
      )}
    </>
  );
}
