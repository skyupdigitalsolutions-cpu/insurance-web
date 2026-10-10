'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { date, dateTime, rupees } from '@/components/portal/format';
import { PAYMENT_METHODS, QUOTE_STATUS, label } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, ButtonLink, ErrorNote, Facts, Loading, Notice, PageHead, Panel, Select } from '@/components/portal/ui';
import { acceptQuote, approveQuote, createPaymentLink, getQuote, listPayments, listPolicies, sendQuote } from '@/lib/portal/api';

type Channel = 'WhatsApp' | 'Email' | 'Link' | 'In person';

export default function QuotationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { can } = useSession();
  const [channel, setChannel] = useState<Channel>('WhatsApp');
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const quote = useQuery({ queryKey: ['quote', id], queryFn: () => getQuote(id) });
  const status = quote.data?.status;
  const payments = useQuery({ queryKey: ['payments'], queryFn: listPayments, enabled: status === 'PAYMENT_PENDING' || status === 'PAID' });
  const policies = useQuery({ queryKey: ['policies', 'quote', id], queryFn: () => listPolicies({ quotationId: id }), enabled: status === 'PAID' });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['quote', id] }), qc.invalidateQueries({ queryKey: ['quotes'] })]);
  const approve = useMutation({ mutationFn: () => approveQuote(id), onSuccess: refresh });
  const send = useMutation({ mutationFn: () => sendQuote(id, channel), onSuccess: refresh });
  const accept = useMutation({ mutationFn: () => acceptQuote(id), onSuccess: refresh });
  const pay = useMutation({ mutationFn: () => createPaymentLink(id, method), onSuccess: async (p) => { await refresh(); router.push(`/app/payments/${p.id}`); } });

  if (quote.isLoading) return <Loading />;
  if (!quote.data) return <ErrorNote error={quote.error} retry={() => void quote.refetch()} />;
  const q = quote.data;
  const [text, tone] = label(QUOTE_STATUS, q.status);
  const pr = q.pricing;
  const expired = q.validUntil ? new Date(q.validUntil) < new Date() : false;
  const payment = payments.data?.find((p) => p.quotationId === q.id);
  const policy = policies.data?.[0];

  return (
    <>
      <PageHead back={{ href: '/app/quotations', label: 'Quotations' }} title={q.quoteNumber} sub={<span className="flex flex-wrap items-center gap-2"><Badge tone={tone}>{text}</Badge>{q.customerName}</span>}
        actions={q.pdfUrl && <a href={q.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => void refresh(), 800)}
          className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink ring-1 ring-line hover:ring-blue/40">View PDF</a>} />
      <ErrorNote error={approve.error ?? send.error ?? accept.error ?? pay.error} />
      {expired && !['PAID', 'CANCELLED'].includes(q.status) && <Notice tone="amber">This quotation expired on {date(q.validUntil)}. Create a new one for the current price.</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <Panel title="Quotation">
            <Facts rows={[['Customer', <Link key="c" href={`/app/customers/${q.customerId}`} className="font-semibold text-blue-deep hover:underline">{q.customerName}</Link>],
              ['Product', `${q.productName} (${q.companyName})`], ['Insurance', q.type], ['Premium paid', q.frequency],
              ['Discount', q.discountPercent ? `${q.discountPercent}% · ${q.discountReason ?? ''}` : 'None'], ['Created', dateTime(q.createdAt)], ['Valid until', date(q.validUntil)]]} />
          </Panel>
          <Panel title="Price">
            <dl className="space-y-2 text-[15px]">
              {([['Base premium', pr.base], ['Add-ons', pr.addOns], ['Discount', -pr.discount], ['GST', pr.gst]] as [string, number][]).map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="tabular">{v < 0 ? `− ${rupees(-v)}` : rupees(v)}</dd></div>
              ))}
              <div className="flex justify-between border-t border-line pt-3 font-display text-[22px] font-semibold"><dt>Total</dt><dd className="tabular">{rupees(pr.total)}</dd></div>
            </dl>
          </Panel>
        </div>
        <Panel title="Next step">
          {q.status === 'DRAFT' && (can('quotation:approve')
            ? <><p className="mb-4 text-muted">The {q.discountPercent}% discount is above the 10% limit and needs approval before the quotation can be sent.</p><Button busy={approve.isPending} onClick={() => approve.mutate()}>Approve discount</Button></>
            : <p className="text-muted">Waiting for the advisor to approve the {q.discountPercent}% discount.</p>)}
          {q.status === 'GENERATED' && can('quotation:create') && (
            <div className="space-y-4">
              <p className="text-muted">Share the PDF with the customer, then record how you sent it.</p>
              <Select label="Sent by" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>{(['WhatsApp', 'Email', 'Link', 'In person'] as const).map((c) => <option key={c}>{c}</option>)}</Select>
              <Button busy={send.isPending} onClick={() => send.mutate()}>Mark as sent</Button>
            </div>
          )}
          {q.status === 'SENT' && can('quotation:create') && (
            <><p className="mb-4 text-muted">When the customer agrees to this quotation, record it to request payment.</p><Button disabled={expired} busy={accept.isPending} onClick={() => accept.mutate()}>Customer accepted</Button></>
          )}
          {q.status === 'ACCEPTED' && (can('payment:create') ? (
            <div className="space-y-4">
              <p className="text-muted">Create a secure payment link for {rupees(pr.total)}. Asking twice returns the same open link, so the customer is never charged twice.</p>
              <Select label="Customer pays by" value={method} onChange={(e) => setMethod(e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
              <Button disabled={expired} busy={pay.isPending} onClick={() => pay.mutate()}>Create payment link</Button>
            </div>
          ) : <p className="text-muted">Your role cannot request payments.</p>)}
          {q.status === 'PAYMENT_PENDING' && (payment ? <ButtonLink href={`/app/payments/${payment.id}`}>Open the payment</ButtonLink> : <Loading />)}
          {q.status === 'PAID' && (
            <div className="space-y-3">
              <p className="text-muted">Paid. The policy record was created automatically.</p>
              {policy && <ButtonLink href={`/app/policies/${policy.id}`}>Open the policy</ButtonLink>}
            </div>
          )}
          {q.status === 'CANCELLED' && <p className="text-muted">This quotation is closed.</p>}
        </Panel>
      </div>
    </>
  );
}
