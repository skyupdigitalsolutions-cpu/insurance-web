'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useState, type SyntheticEvent } from 'react';
import { date, mobile } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { Badge, Button, Dialog, Empty, ErrorNote, Input, Loading, PageHead, RowLink, Table, Td } from '@/components/portal/ui';
import { createCustomer, listCustomers } from '@/lib/portal/api';
import { ApiError } from '@/lib/portal/client';

type Errors = Record<string, string | undefined>;

function NewCustomerDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const save = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (c) => { await qc.invalidateQueries({ queryKey: ['customers'] }); router.push(`/app/customers/${c.id}`); },
    onError: (err) => { if (err instanceof ApiError && err.details.length) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message]))); },
  });
  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const local: Errors = {};
    if ((f.name ?? '').trim().length < 2) local.name = 'Enter the name';
    if (!/^(\+?91)?[6-9]\d{9}$/.test((f.mobile ?? '').replace(/[\s-]/g, ''))) local.mobile = 'Enter a 10-digit Indian mobile number';
    if (f.pin && !/^[1-9]\d{5}$/.test(f.pin)) local.pin = 'PIN code has 6 digits';
    setErrors(local);
    if (Object.values(local).some(Boolean)) return;
    const opt = (k: string) => ((f[k] ?? '').trim() || undefined);
    save.mutate({ name: f.name!.trim(), mobile: f.mobile!, email: opt('email'), dob: opt('dob'), city: opt('city'), pin: opt('pin'), source: 'Direct' });
  }
  return (
    <Dialog title="Add customer" wide onClose={onClose} footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button type="submit" form="new-customer" busy={save.isPending}>Save customer</Button>
    </>}>
      {save.error && !(save.error instanceof ApiError && save.error.details.length) && <ErrorNote error={save.error} />}
      <form id="new-customer" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="name" error={errors.name} />
        <Input label="Mobile" name="mobile" type="tel" inputMode="tel" placeholder="98765 43210" error={errors.mobile} />
        <Input label="Email (optional)" name="email" type="email" error={errors.email} />
        <Input label="Date of birth (optional)" name="dob" type="date" max={new Date().toISOString().slice(0, 10)} error={errors.dob} />
        <Input label="City (optional)" name="city" error={errors.city} />
        <Input label="PIN code (optional)" name="pin" inputMode="numeric" maxLength={6} error={errors.pin} />
      </form>
      <p className="mt-4 text-[13.5px] text-muted">Converting a lead creates the customer for you, with the lead’s details.</p>
    </Dialog>
  );
}

export default function CustomersPage() {
  const { can } = useSession();
  const [q, setQ] = useState('');
  const query = useDeferredValue(q.trim());
  const [adding, setAdding] = useState(false);
  const customers = useQuery({ queryKey: ['customers', query], queryFn: () => listCustomers(query) });
  return (
    <>
      <PageHead title="Customers" sub="One file per customer: family, nominees, documents, quotations and policies."
        actions={can('customer:create') && <Button onClick={() => setAdding(true)}>Add customer</Button>} />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or mobile" aria-label="Search customers"
        className="mb-4 w-full max-w-[320px] rounded-full border border-line bg-white px-4 py-2 text-[15px] outline-none focus:border-blue" />
      <ErrorNote error={customers.error} retry={() => void customers.refetch()} />
      {customers.isLoading ? <Loading /> : (
        <Table head={['Name', 'Mobile', 'City', 'Source', 'Consent', 'Since']}
          empty={!customers.data?.length && <Empty title={query ? 'No customers match' : 'No customers yet'} text="Convert a lead, or add a customer you already serve." />}>
          {customers.data?.map((c) => (
            <tr key={c.id}>
              <Td><RowLink href={`/app/customers/${c.id}`}>{c.name}</RowLink>{c.email && <span className="block text-[13px] text-muted">{c.email}</span>}</Td>
              <Td className="tabular whitespace-nowrap">{mobile(c.mobile)}</Td>
              <Td>{c.city ?? '—'}</Td>
              <Td>{c.source}</Td>
              <Td>{c.consentGiven ? <Badge tone="green">Given</Badge> : <Badge tone="amber">Not yet</Badge>}</Td>
              <Td className="whitespace-nowrap text-muted">{date(c.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
      {adding && <NewCustomerDialog onClose={() => setAdding(false)} />}
    </>
  );
}
