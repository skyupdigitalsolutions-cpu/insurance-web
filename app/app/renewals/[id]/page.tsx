'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { date, dateTime, dueIn, mobile, rupees } from '@/components/portal/format';
import { RENEWAL_OUTCOMES, RENEWAL_STATUS } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, ButtonLink, Dialog, Empty, ErrorNote, Facts, Loading, PageHead, Panel, Select, Textarea } from '@/components/portal/ui';
import { closeRenewal, getRenewal, logRenewalContact } from '@/lib/portal/api';

export default function RenewalPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useSession();
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState('');
  const renewal = useQuery({ queryKey: ['renewal', id], queryFn: () => getRenewal(id) });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['renewal', id] }), qc.invalidateQueries({ queryKey: ['renewals'] })]);
  const log = useMutation({ mutationFn: (v: { outcome: string; notes?: string }) => logRenewalContact(id, v.outcome, v.notes), onSuccess: refresh });
  const close = useMutation({ mutationFn: () => closeRenewal(id, reason.trim()), onSuccess: async () => { setClosing(false); await refresh(); } });

  if (renewal.isLoading) return <Loading />;
  if (!renewal.data) return <ErrorNote error={renewal.error} retry={() => void renewal.refetch()} />;
  const r = renewal.data;
  const open = r.status !== 'Renewed' && r.status !== 'Closed';
  const manage = can('renewal:manage') && open;

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const notes = String(f.get('notes') ?? '').trim();
    log.mutate({ outcome: String(f.get('outcome')), ...(notes ? { notes } : {}) }, { onSuccess: () => (e.target as HTMLFormElement).reset() });
  }

  return (
    <>
      <PageHead back={{ href: '/app/renewals', label: 'Renewals' }} title={r.customerName}
        sub={<span className="flex flex-wrap items-center gap-2"><Badge tone={RENEWAL_STATUS[r.status] ?? 'grey'}>{r.status}</Badge>{dueIn(r.daysLeft)}</span>}
        actions={<>
          <a href={`tel:${r.customerMobile}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink ring-1 ring-line hover:ring-blue/40">Call {mobile(r.customerMobile)}</a>
          {open && can('quotation:create') && <ButtonLink href={`/app/quotations/new?customerId=${r.customerId}${r.productId ? `&productId=${r.productId}` : ''}`}>Renewal quotation</ButtonLink>}
          {manage && <Button variant="danger" onClick={() => setClosing(true)}>Close renewal</Button>}
        </>} />
      <ErrorNote error={log.error} />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Policy">
            <Facts rows={[['Customer', <Link key="c" href={`/app/customers/${r.customerId}`} className="font-semibold text-blue-deep hover:underline">{r.customerName}</Link>],
              ['Policy', r.policyNumber], ['Product', `${r.productName} (${r.companyName})`], ['Last premium', rupees(r.premium)], ['Due', date(r.dueDate)],
              ...(r.closedReason ? [['Closed because', r.closedReason] as [string, string]] : [])]} />
          </Panel>
          {manage && (
            <Panel title="Log a renewal call">
              <form onSubmit={submit} className="grid gap-4">
                <Select label="Outcome" name="outcome">{RENEWAL_OUTCOMES.map((o) => <option key={o}>{o}</option>)}</Select>
                <Textarea label="Notes (optional)" name="notes" rows={2} />
                <div><Button type="submit" busy={log.isPending}>Save call</Button></div>
              </form>
            </Panel>
          )}
        </div>
        <Panel title="Calls so far">
          {r.contacts.length ? (
            <ol className="-my-2 divide-y divide-line">{r.contacts.map((c) => (
              <li key={c.id} className="py-3"><div className="flex justify-between gap-3"><span className="font-semibold text-ink">{c.outcome}</span><span className="text-[13px] text-muted">{dateTime(c.at)}</span></div>
                {c.notes && <p className="mt-1 text-[14.5px] text-muted">{c.notes}</p>}</li>
            ))}</ol>
          ) : <Empty title="No calls yet" text="Each call you log here moves the renewal to Contacted." />}
        </Panel>
      </div>
      {closing && (
        <Dialog title="Close this renewal?" onClose={() => setClosing(false)} footer={<><Button variant="secondary" onClick={() => setClosing(false)}>Cancel</Button>
          <Button variant="danger" disabled={reason.trim().length < 3} busy={close.isPending} onClick={() => close.mutate()}>Close renewal</Button></>}>
          <ErrorNote error={close.error} />
          <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Customer moved to another insurer" />
          <p className="mt-2 text-[13.5px] text-muted">No more reminders are sent for a closed renewal.</p>
        </Dialog>
      )}
    </>
  );
}
