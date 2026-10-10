'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { date, dateTime, rupees } from '@/components/portal/format';
import { POLICY_STATUS, label } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, ButtonLink, ErrorNote, Facts, Loading, PageHead, Panel } from '@/components/portal/ui';
import { getPolicy, issuanceChecklist, issuePolicy } from '@/lib/portal/api';

export default function PolicyPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { can } = useSession();
  const policy = useQuery({ queryKey: ['policy', id], queryFn: () => getPolicy(id) });
  const pending = policy.data?.status === 'PENDING_ISSUANCE';
  const checklist = useQuery({ queryKey: ['checklist', id], queryFn: () => issuanceChecklist(id), enabled: pending });
  const issue = useMutation({ mutationFn: () => issuePolicy(id), onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['policy', id] }), qc.invalidateQueries({ queryKey: ['policies'] })]) });

  if (policy.isLoading) return <Loading />;
  if (!policy.data) return <ErrorNote error={policy.error} retry={() => void policy.refetch()} />;
  const p = policy.data;
  const [t, tone] = label(POLICY_STATUS, p.status);
  const ready = checklist.data?.every((c) => c.passed) ?? false;

  return (
    <>
      <PageHead back={{ href: '/app/policies', label: 'Policies' }} title={p.policyNumber ?? 'Policy waiting to be issued'} sub={<span className="flex items-center gap-2"><Badge tone={tone}>{t}</Badge>{p.customerName}</span>}
        actions={<ButtonLink href={`/app/quotations/${p.quotationId}`} variant="secondary">Quotation</ButtonLink>} />
      <ErrorNote error={issue.error} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Policy">
          <Facts rows={[['Customer', <Link key="c" href={`/app/customers/${p.customerId}`} className="font-semibold text-blue-deep hover:underline">{p.customerName}</Link>],
            ['Product', `${p.productName} (${p.companyName})`], ['Premium', rupees(p.premium)], ['Starts', date(p.startDate)], ['Renews on', date(p.endDate)], ['Created', dateTime(p.createdAt)]]} />
        </Panel>
        {pending ? (
          <Panel title="Before issuing">
            {checklist.isLoading ? <Loading /> : (
              <ul className="space-y-3">
                {checklist.data?.map((c) => (
                  <li key={c.key} className="flex gap-3">
                    <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white ${c.passed ? 'bg-[#1e8e5a]' : 'bg-[#e0a43a]'}`}>{c.passed ? '✓' : '!'}</span>
                    <span><span className="block font-semibold text-ink">{c.label}<span className="sr-only">{c.passed ? ' – done' : ' – not done'}</span></span>{!c.passed && <span className="block text-[14px] text-muted">{c.fixHint}</span>}</span>
                  </li>
                ))}
              </ul>
            )}
            {can('policy:issue') && <Button className="mt-5" disabled={!ready} busy={issue.isPending} onClick={() => issue.mutate()}>Issue policy</Button>}
          </Panel>
        ) : (
          <Panel title="Renewal">
            <p className="text-muted">This policy enters the renewal list 60 days before {date(p.endDate)}. Reminders go out 30, 7 and 1 day before.</p>
            {can('renewal:read') && <div className="mt-4"><ButtonLink href={`/app/renewals/${p.id}`} variant="secondary">Open renewal</ButtonLink></div>}
          </Panel>
        )}
      </div>
    </>
  );
}
