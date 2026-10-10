'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { DocumentsPanel, FamilyPanel, NeedPanel, NomineesPanel, SalesPanel } from '@/components/portal/customers/Panels';
import { date, dateTime, mobile } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { Badge, Button, ButtonLink, ErrorNote, Facts, Loading, PageHead, Panel, Segmented } from '@/components/portal/ui';
import { getCustomer, recordConsent } from '@/lib/portal/api';

const TABS = [['overview', 'Overview'], ['needs', 'Needs and suggestions'], ['documents', 'Documents'], ['sales', 'Quotations and policies']] as const;
type TabKey = (typeof TABS)[number][0];

export default function CustomerPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useSession();
  const [tab, setTab] = useState<TabKey>('overview');
  const customer = useQuery({ queryKey: ['customer', id], queryFn: () => getCustomer(id) });
  const consent = useMutation({ mutationFn: () => recordConsent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', id] }) });

  if (customer.isLoading) return <Loading />;
  if (!customer.data) return <ErrorNote error={customer.error} retry={() => void customer.refetch()} />;
  const c = customer.data;

  return (
    <>
      <PageHead back={{ href: '/app/customers', label: 'Customers' }} title={c.name}
        sub={<span className="tabular">{mobile(c.mobile)}{c.city ? ` · ${c.city}` : ''}</span>}
        actions={<>
          <a href={`tel:${c.mobile}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink ring-1 ring-line hover:ring-blue/40">Call</a>
          {can('quotation:create') && <ButtonLink href={`/app/quotations/new?customerId=${c.id}`}>New quotation</ButtonLink>}
        </>} />
      <div className="mb-6"><Segmented label="Section" value={tab} options={TABS} onChange={setTab} /></div>
      {tab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <Panel title="Details">
              <Facts rows={[['Email', c.email ?? '—'], ['Date of birth', date(c.dob)], ['City / PIN', [c.city, c.pin].filter(Boolean).join(' – ') || '—'], ['Source', c.source], ['Customer since', date(c.createdAt)]]} />
            </Panel>
            <Panel title="Consent">
              {c.consentGiven ? (
                <p className="text-[15px]"><Badge tone="green">Given</Badge> <span className="ml-2 text-muted">Recorded {dateTime(c.consentAt)}. WhatsApp reminders may be sent.</span></p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-[46ch] text-[15px] text-muted">Ask the customer before recording consent. Without it, no WhatsApp messages are sent to them.</p>
                  {can('customer:update') && <Button busy={consent.isPending} onClick={() => consent.mutate()}>Record consent</Button>}
                </div>
              )}
              <ErrorNote error={consent.error} />
            </Panel>
          </div>
          <div className="space-y-6"><FamilyPanel customerId={c.id} /><NomineesPanel customerId={c.id} /></div>
        </div>
      )}
      {tab === 'needs' && <NeedPanel customerId={c.id} />}
      {tab === 'documents' && <DocumentsPanel customerId={c.id} />}
      {tab === 'sales' && <SalesPanel customerId={c.id} />}
    </>
  );
}
