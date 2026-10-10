'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';
import { date, mobile } from '@/components/portal/format';
import { INSURANCE_TYPES, REFERRAL_RELATIONSHIPS } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, Dialog, Empty, ErrorNote, Input, Loading, PageHead, RowLink, Select, Table, Td } from '@/components/portal/ui';
import { createReferral, listCustomers, listReferrals } from '@/lib/portal/api';
import { ApiError } from '@/lib/portal/client';

const TONE = { Assigned: 'blue', Converted: 'green', Rejected: 'grey' } as const;

export default function ReferralsPage() {
  const qc = useQueryClient();
  const { can } = useSession();
  const [adding, setAdding] = useState(false);
  const [by, setBy] = useState<'customer' | 'code'>('customer');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const referrals = useQuery({ queryKey: ['referrals'], queryFn: listReferrals });
  const customers = useQuery({ queryKey: ['customers', ''], queryFn: () => listCustomers(''), enabled: adding });
  const add = useMutation({
    mutationFn: createReferral,
    onSuccess: async () => { setAdding(false); await Promise.all([qc.invalidateQueries({ queryKey: ['referrals'] }), qc.invalidateQueries({ queryKey: ['leads'] })]); },
    onError: (err) => { if (err instanceof ApiError && err.details.length) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message]))); },
  });

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const local: Record<string, string> = {};
    if ((f.name ?? '').trim().length < 2) local.name = 'Enter the name';
    if (!/^(\+?91)?[6-9]\d{9}$/.test((f.mobile ?? '').replace(/[\s-]/g, ''))) local.mobile = 'Enter a 10-digit Indian mobile number';
    if (by === 'customer' && !f.referrer) local.referrerCustomerId = 'Choose who referred them';
    if (by === 'code' && !(f.code ?? '').trim()) local.code = 'Enter the referral code';
    setErrors(local);
    if (Object.keys(local).length) return;
    add.mutate({ name: f.name!.trim(), mobile: f.mobile!, relationship: f.relationship!, interest: f.interest!, ...(by === 'customer' ? { referrerCustomerId: f.referrer } : { code: f.code!.trim().toUpperCase() }) });
  }

  return (
    <>
      <PageHead title="Referrals" sub="People your customers sent your way. Each referral becomes a lead with the referrer locked on it."
        actions={can('referral:create') && <Button onClick={() => { setErrors({}); setAdding(true); }}>Record referral</Button>} />
      <ErrorNote error={referrals.error} retry={() => void referrals.refetch()} />
      {referrals.isLoading ? <Loading /> : (
        <Table head={['Referred person', 'Mobile', 'Referred by', 'Interest', 'Status', 'Date']} empty={!referrals.data?.length && <Empty title="No referrals yet" text="Ask happy customers who else they know who needs cover." />}>
          {referrals.data?.map((r) => (
            <tr key={r.id}>
              <Td><RowLink href={`/app/leads/${r.leadId}`}>{r.name}</RowLink><span className="block text-[13px] text-muted">{r.relationship}</span></Td>
              <Td className="tabular whitespace-nowrap">{mobile(r.mobile)}</Td>
              <Td>{r.referrerName}{r.code && <span className="block text-[13px] text-muted">{r.code}</span>}</Td>
              <Td>{r.interest}</Td>
              <Td><Badge tone={TONE[r.status]}>{r.status}</Badge></Td>
              <Td className="whitespace-nowrap text-muted">{date(r.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
      {adding && (
        <Dialog title="Record referral" wide onClose={() => setAdding(false)} footer={<><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" form="ref" busy={add.isPending}>Save referral</Button></>}>
          {add.error && !(add.error instanceof ApiError && add.error.details.length) && <ErrorNote error={add.error} />}
          <form id="ref" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Select label="Referred by" value={by} onChange={(e) => setBy(e.target.value as 'customer' | 'code')}><option value="customer">An existing customer</option><option value="code">A referral code</option></Select>
            {by === 'customer' ? (
              <Select label="Customer" name="referrer" error={errors.referrerCustomerId} defaultValue=""><option value="" disabled>Choose</option>{customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            ) : <Input label="Referral code" name="code" error={errors.code} placeholder="e.g. REF100" />}
            <Input label="Name" name="name" error={errors.name} />
            <Input label="Mobile" name="mobile" type="tel" error={errors.mobile} />
            <Select label="Relationship" name="relationship">{REFERRAL_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}</Select>
            <Select label="Interested in" name="interest">{INSURANCE_TYPES.map((r) => <option key={r}>{r}</option>)}</Select>
          </form>
        </Dialog>
      )}
    </>
  );
}
