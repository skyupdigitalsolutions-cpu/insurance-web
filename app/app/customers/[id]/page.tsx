'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { DocumentsPanel, FamilyPanel, NeedPanel, NomineesPanel, SalesPanel } from '@/components/portal/customers/Panels';
import { date, dateTime, mobile } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { Badge, Button, ButtonLink, Dialog, ErrorNote, Facts, Input, Loading, PageHead, Panel, Segmented } from '@/components/portal/ui';
import { getCustomer, recordConsent, updateCustomer } from '@/lib/portal/api';

const TABS = [['overview', 'Overview'], ['needs', 'Needs and suggestions'], ['documents', 'Documents'], ['sales', 'Quotations and policies']] as const;
type TabKey = (typeof TABS)[number][0];

export default function CustomerPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useSession();
  const [tab, setTab] = useState<TabKey>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const customer = useQuery({ queryKey: ['customer', id], queryFn: () => getCustomer(id) });
  const consent = useMutation({ mutationFn: () => recordConsent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', id] }) });
  const edit = useMutation({ mutationFn: (data: Parameters<typeof updateCustomer>[1]) => updateCustomer(id, data), onSuccess: async () => { setEditOpen(false); await qc.invalidateQueries({ queryKey: ['customer', id] }); } });

  if (customer.isLoading) return <Loading />;
  if (!customer.data) return <ErrorNote error={customer.error} retry={() => void customer.refetch()} />;
  const c = customer.data;

  function submitEdit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    edit.mutate({
      name: (f['name'] ?? '').trim() || undefined,
      mobile: (f['mobile'] ?? '').trim() || undefined,
      email: (f['email'] ?? '').trim() || null,
      dob: (f['dob'] ?? '') || null,
      city: (f['city'] ?? '').trim() || null,
      pin: (f['pin'] ?? '').trim() || null,
    });
  }

  return (
    <>
      <PageHead back={{ href: '/app/customers', label: 'Customers' }} title={c.name}
        sub={<span className="tabular">{mobile(c.mobile)}{c.city ? ` · ${c.city}` : ''}</span>}
        actions={<>
          <a href={`tel:${c.mobile}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink ring-1 ring-line hover:ring-blue/40">Call</a>
          {can('customer:update') && <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit</Button>}
          {can('quotation:create') && <ButtonLink href={`/app/quotations/new?customerId=${c.id}`}>New quotation</ButtonLink>}
        </>} />
      <div className="mb-6"><Segmented label="Section" value={tab} options={TABS} onChange={setTab} /></div>
      {tab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <Panel title="Details">
              <Facts rows={[
                ['Email', c.email ?? '—'],
                ['Date of birth', date(c.dob)],
                ['City / PIN', [c.city, c.pin].filter(Boolean).join(' – ') || '—'],
                ['Source', c.source],
                ['Customer since', date(c.createdAt)],
              ]} />
              {!c.consentGiven && can('customer:update') && (
                <div className="mt-4">
                  <Button variant="secondary" busy={consent.isPending} onClick={() => consent.mutate()}>Record consent</Button>
                  <p className="mt-2 text-[13px] text-muted">WhatsApp messages require consent.</p>
                </div>
              )}
              {c.consentGiven && <p className="mt-4 text-[13.5px]"><Badge tone="green">Consent given</Badge></p>}
            </Panel>
            <FamilyPanel customerId={c.id} />
            <NomineesPanel customerId={c.id} />
          </div>
          <div className="space-y-6">
            <NeedPanel customerId={c.id} />
          </div>
        </div>
      )}
      {tab === 'needs' && <NeedPanel customerId={c.id} />}
      {tab === 'documents' && <DocumentsPanel customerId={c.id} />}
      {tab === 'sales' && <SalesPanel customerId={c.id} />}

      {/* Edit customer dialog */}
      {editOpen && (
        <Dialog title="Edit customer" wide onClose={() => setEditOpen(false)} footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" form="customer-edit" busy={edit.isPending}>Save changes</Button></>}>
          <ErrorNote error={edit.error} />
          <form id="customer-edit" onSubmit={submitEdit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="name" defaultValue={c.name} required />
            <Input label="Mobile" name="mobile" type="tel" defaultValue={c.mobile} required />
            <Input label="Email (optional)" name="email" type="email" defaultValue={c.email ?? ''} />
            <Input label="Date of birth (optional)" name="dob" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={c.dob ?? ''} />
            <Input label="City (optional)" name="city" defaultValue={c.city ?? ''} />
            <Input label="PIN code (optional)" name="pin" inputMode="numeric" maxLength={6} defaultValue={c.pin ?? ''} />
          </form>
        </Dialog>
      )}
    </>
  );
}
