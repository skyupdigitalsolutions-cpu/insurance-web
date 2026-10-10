'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { date, rupees } from '@/components/portal/format';
import { QUOTE_STATUS, label } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, ButtonLink, Empty, ErrorNote, Loading, PageHead, RowLink, Segmented, Table, Td } from '@/components/portal/ui';
import { listQuotes } from '@/lib/portal/api';

const FILTERS = [['all', 'All'], ['open', 'In progress'], ['PAID', 'Paid'], ['CANCELLED', 'Cancelled']] as const;

export default function QuotationsPage() {
  const { can } = useSession();
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>('all');
  const quotes = useQuery({ queryKey: ['quotes'], queryFn: () => listQuotes() });
  const items = (quotes.data ?? []).filter((q) => filter === 'all' || (filter === 'open' ? !['PAID', 'CANCELLED'].includes(q.status) : q.status === filter));
  return (
    <>
      <PageHead title="Quotations" sub="Every quotation keeps the price and product details from the day it was made."
        actions={can('quotation:create') && <ButtonLink href="/app/quotations/new">New quotation</ButtonLink>} />
      <div className="mb-4"><Segmented label="Show" value={filter} options={FILTERS} onChange={setFilter} /></div>
      <ErrorNote error={quotes.error} retry={() => void quotes.refetch()} />
      {quotes.isLoading ? <Loading /> : (
        <Table head={['Number', 'Customer', 'Product', 'Total', 'Status', 'Created']} empty={!items.length && <Empty title="No quotations here" text="Create a quotation from a customer's file or from Products." />}>
          {items.map((q) => { const [t, tone] = label(QUOTE_STATUS, q.status); return (
            <tr key={q.id}>
              <Td><RowLink href={`/app/quotations/${q.id}`}>{q.quoteNumber}</RowLink></Td>
              <Td>{q.customerName}</Td>
              <Td>{q.productName}<span className="block text-[13px] text-muted">{q.companyName}</span></Td>
              <Td className="tabular whitespace-nowrap">{rupees(q.pricing.total)}</Td>
              <Td><Badge tone={tone}>{t}</Badge></Td>
              <Td className="whitespace-nowrap text-muted">{date(q.createdAt)}</Td>
            </tr>); })}
        </Table>
      )}
    </>
  );
}
