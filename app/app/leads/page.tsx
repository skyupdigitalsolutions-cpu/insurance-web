'use client';

import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { NewLeadDialog } from '@/components/portal/leads/NewLeadDialog';
import { date, mobile } from '@/components/portal/format';
import { LEAD_STATUS, label } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, Empty, ErrorNote, Loading, PageHead, RowLink, Segmented, Table, Td } from '@/components/portal/ui';
import { listLeads } from '@/lib/portal/api';
import type { LeadStatus } from '@/lib/portal/types';

const FILTERS = [['ALL', 'All'], ['NEW', 'New'], ['CONTACTED', 'Contacted'], ['QUALIFIED', 'Qualified'], ['FOLLOW_UP', 'Follow up'], ['CONVERTED', 'Converted'], ['LOST', 'Lost']] as const;

export default function LeadsPage() {
  const { can } = useSession();
  const [q, setQ] = useState('');
  const query = useDeferredValue(q.trim());
  const [status, setStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [adding, setAdding] = useState(false);
  const leads = useQuery({ queryKey: ['leads', query, status], queryFn: () => listLeads(query, status) });

  return (
    <>
      <PageHead title="Leads" sub="Everyone who asked about insurance, until they become a customer."
        actions={can('lead:create') && <Button onClick={() => setAdding(true)}>Add lead</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or mobile" aria-label="Search leads"
          className="w-full max-w-[320px] rounded-full border border-line bg-white px-4 py-2 text-[15px] outline-none focus:border-blue" />
        <Segmented label="Status" value={status} options={FILTERS} onChange={setStatus} />
      </div>
      <ErrorNote error={leads.error} retry={() => void leads.refetch()} />
      {leads.isLoading ? <Loading /> : (
        <Table head={['Name', 'Mobile', 'Source', 'Need', 'Status', 'Added']}
          empty={!leads.data?.length && <Empty title={query || status !== 'ALL' ? 'No leads match' : 'No leads yet'} text="Add a lead when someone asks about insurance, or record a referral." />}>
          {leads.data?.map((l) => {
            const [text, tone] = label(LEAD_STATUS, l.status);
            return (
              <tr key={l.id}>
                <Td><RowLink href={`/app/leads/${l.id}`}>{l.name}</RowLink></Td>
                <Td className="tabular whitespace-nowrap">{mobile(l.mobile)}</Td>
                <Td>{l.source}{l.referralCode ? <span className="block text-[13px] text-muted">{l.referralCode}</span> : null}</Td>
                <Td className="max-w-[280px] text-muted">{l.requirement ?? '—'}</Td>
                <Td><Badge tone={tone}>{text}</Badge></Td>
                <Td className="whitespace-nowrap text-muted">{date(l.createdAt)}</Td>
              </tr>
            );
          })}
        </Table>
      )}
      {adding && <NewLeadDialog onClose={() => setAdding(false)} />}
    </>
  );
}
