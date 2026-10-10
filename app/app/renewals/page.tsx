'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { date, dueIn, rupees } from '@/components/portal/format';
import { RENEWAL_STATUS } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Empty, ErrorNote, Loading, PageHead, RowLink, Segmented, Table, Td, UpgradeNote } from '@/components/portal/ui';
import { listRenewals } from '@/lib/portal/api';
import type { RenewalWindow } from '@/lib/portal/types';

const WINDOWS = [['overdue', 'Overdue'], ['7d', 'Next 7 days'], ['30d', 'Next 30 days'], ['all', 'All (60 days)']] as const;

export default function RenewalsPage() {
  const { has } = useSession();
  const [win, setWin] = useState<RenewalWindow>('30d');
  const renewals = useQuery({ queryKey: ['renewals', win], queryFn: () => listRenewals(win), enabled: has('renewals') });
  if (!has('renewals')) return <><PageHead title="Renewals" /><UpgradeNote feature="Renewals" /></>;
  return (
    <>
      <PageHead title="Renewals" sub="Policies coming up for renewal, from their real end dates. Call, record what was said, or close with a reason." />
      <div className="mb-4"><Segmented label="Window" value={win} options={WINDOWS} onChange={setWin} /></div>
      <ErrorNote error={renewals.error} retry={() => void renewals.refetch()} />
      {renewals.isLoading ? <Loading /> : (
        <Table head={['Customer', 'Policy', 'Premium', 'Due', 'Status']} empty={!renewals.data?.length && <Empty title="Nothing due in this window" />}>
          {renewals.data?.map((r) => (
            <tr key={r.id}>
              <Td><RowLink href={`/app/renewals/${r.id}`}>{r.customerName}</RowLink></Td>
              <Td>{r.productName}<span className="block text-[13px] text-muted">{r.companyName} · {r.policyNumber}</span></Td>
              <Td className="tabular whitespace-nowrap">{rupees(r.premium)}</Td>
              <Td className="whitespace-nowrap">{date(r.dueDate)}<span className={`block text-[13px] ${r.daysLeft < 0 ? 'font-semibold text-[#b42335]' : r.daysLeft <= 7 ? 'font-semibold text-[#94590a]' : 'text-muted'}`}>{dueIn(r.daysLeft)}</span></Td>
              <Td><Badge tone={RENEWAL_STATUS[r.status] ?? 'grey'}>{r.status}</Badge></Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
