'use client';

import { useQuery } from '@tanstack/react-query';
import { dateTime, rupees } from '@/components/portal/format';
import { PAYMENT_STATUS, label } from '@/components/portal/options';
import { Badge, Empty, ErrorNote, Loading, PageHead, RowLink, Table, Td } from '@/components/portal/ui';
import { listPayments } from '@/lib/portal/api';

export default function PaymentsPage() {
  const payments = useQuery({ queryKey: ['payments'], queryFn: listPayments, refetchInterval: 30_000 });
  return (
    <>
      <PageHead title="Payments" sub="Payment links you sent and what happened to them. Updates arrive from the payment provider on their own." />
      <ErrorNote error={payments.error} retry={() => void payments.refetch()} />
      {payments.isLoading ? <Loading /> : (
        <Table head={['Customer', 'Quotation', 'Amount', 'Method', 'Status', 'Created']} empty={!payments.data?.length && <Empty title="No payments yet" text="Request a payment from an accepted quotation." />}>
          {payments.data?.map((p) => { const [t, tone] = label(PAYMENT_STATUS, p.status); return (
            <tr key={p.id}>
              <Td><RowLink href={`/app/payments/${p.id}`}>{p.customerName}</RowLink></Td>
              <Td>{p.quoteNumber}</Td>
              <Td className="tabular whitespace-nowrap">{rupees(p.amount)}</Td>
              <Td>{p.method}</Td>
              <Td><Badge tone={tone}>{t}</Badge>{p.failureReason && <span className="block text-[13px] text-muted">{p.failureReason}</span>}</Td>
              <Td className="whitespace-nowrap text-muted">{dateTime(p.createdAt)}</Td>
            </tr>); })}
        </Table>
      )}
    </>
  );
}
