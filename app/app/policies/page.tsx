'use client';

import { useQuery } from '@tanstack/react-query';
import { date, rupees } from '@/components/portal/format';
import { POLICY_STATUS, label } from '@/components/portal/options';
import { Badge, Empty, ErrorNote, Loading, PageHead, RowLink, Table, Td } from '@/components/portal/ui';
import { listPolicies } from '@/lib/portal/api';

export default function PoliciesPage() {
  const policies = useQuery({ queryKey: ['policies'], queryFn: () => listPolicies() });
  return (
    <>
      <PageHead title="Policies" sub="Created automatically when a payment arrives. Issue them once the insurer confirms." />
      <ErrorNote error={policies.error} retry={() => void policies.refetch()} />
      {policies.isLoading ? <Loading /> : (
        <Table head={['Policy', 'Customer', 'Product', 'Premium', 'Status', 'Renews on']} empty={!policies.data?.length && <Empty title="No policies yet" text="Policies appear here when customers pay." />}>
          {policies.data?.map((p) => { const [t, tone] = label(POLICY_STATUS, p.status); return (
            <tr key={p.id}>
              <Td><RowLink href={`/app/policies/${p.id}`}>{p.policyNumber ?? 'Not issued yet'}</RowLink></Td>
              <Td>{p.customerName}</Td>
              <Td>{p.productName}<span className="block text-[13px] text-muted">{p.companyName}</span></Td>
              <Td className="tabular whitespace-nowrap">{rupees(p.premium)}</Td>
              <Td><Badge tone={tone}>{t}</Badge></Td>
              <Td className="whitespace-nowrap">{date(p.endDate)}</Td>
            </tr>); })}
        </Table>
      )}
    </>
  );
}
