'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { dateTime, rupees } from '@/components/portal/format';
import { PAYMENT_STATUS, label } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, ButtonLink, ErrorNote, Facts, Loading, PageHead, Panel } from '@/components/portal/ui';
import { getPayment, listPolicies, retryPayment } from '@/lib/portal/api';

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useSession();
  const [copied, setCopied] = useState(false);
  // While waiting, check every 10 seconds: the page turns "Paid" by itself
  const payment = useQuery({ queryKey: ['payment', id], queryFn: () => getPayment(id), refetchInterval: (q) => (q.state.data?.status === 'PENDING' ? 10_000 : false) });
  const paid = payment.data?.status === 'SUCCESS';
  const policy = useQuery({ queryKey: ['policies', 'quote', payment.data?.quotationId], queryFn: () => listPolicies({ quotationId: payment.data!.quotationId }), enabled: paid });
  const retry = useMutation({ mutationFn: () => retryPayment(id), onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['payment', id] }), qc.invalidateQueries({ queryKey: ['payments'] })]) });

  if (payment.isLoading) return <Loading />;
  if (!payment.data) return <ErrorNote error={payment.error} retry={() => void payment.refetch()} />;
  const p = payment.data;
  const [t, tone] = label(PAYMENT_STATUS, p.status);
  const message = `Dear ${p.customerName.split(' ')[0]}, please pay ${rupees(p.amount)} for quotation ${p.quoteNumber} securely here: ${p.link}`;

  async function copy() {
    try { await navigator.clipboard.writeText(p.link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked: the link is visible to copy by hand */ }
  }

  return (
    <>
      <PageHead back={{ href: '/app/payments', label: 'Payments' }} title={rupees(p.amount)} sub={<span className="flex items-center gap-2"><Badge tone={tone}>{t}</Badge>{p.customerName} · {p.quoteNumber}</span>} />
      <ErrorNote error={retry.error} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Payment">
          <Facts rows={[['Method', p.method], ['Created', dateTime(p.createdAt)], ['Paid', dateTime(p.paidAt)], ['Transaction', p.transactionRef ?? '—'], ...(p.failureReason ? [['Reason', p.failureReason] as [string, string]] : [])]} />
        </Panel>
        <Panel title={p.status === 'PENDING' ? 'Share the link' : p.status === 'SUCCESS' ? 'Done' : 'Try again'}>
          {p.status === 'PENDING' && (
            <div className="space-y-4">
              <p className="break-all rounded-xl bg-paper px-4 py-3 font-mono text-[13.5px] text-ink">{p.link}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void copy()}>{copied ? 'Copied' : 'Copy link'}</Button>
                <a className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink ring-1 ring-line hover:ring-blue/40" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>Share on WhatsApp</a>
                <a className="inline-flex items-center rounded-full px-4 py-2 text-[14px] font-semibold text-blue-deep hover:bg-mist" target="_blank" rel="noopener noreferrer" href={p.link}>Open payment page</a>
              </div>
              <p className="text-[13.5px] text-muted">This page checks every 10 seconds and turns “Paid” as soon as the money arrives.</p>
            </div>
          )}
          {p.status === 'SUCCESS' && (
            <div className="space-y-3"><p className="text-muted">The payment is confirmed and the policy record was created.</p>
              {policy.data?.[0] && <ButtonLink href={`/app/policies/${policy.data[0].id}`}>Open the policy</ButtonLink>}</div>
          )}
          {p.status === 'FAILED' && (
            <div className="space-y-3"><p className="text-muted">{p.failureReason ?? 'The payment did not go through.'} Send a fresh link; the customer is never charged twice.</p>
              {can('payment:create') && <Button busy={retry.isPending} onClick={() => retry.mutate()}>Send a new link</Button>}</div>
          )}
        </Panel>
      </div>
    </>
  );
}
