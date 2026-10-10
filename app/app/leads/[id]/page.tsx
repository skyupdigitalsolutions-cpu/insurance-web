'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { dateTime, mobile } from '@/components/portal/format';
import { CONTACT_TYPES, LEAD_OUTCOMES, LEAD_STATUS, label } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, ButtonLink, Dialog, Empty, ErrorNote, Facts, Input, Loading, PageHead, Panel, Select, Textarea } from '@/components/portal/ui';
import { convertLead, getLead, logLeadActivity, setLeadStatus, updateLead } from '@/lib/portal/api';
import type { LeadActivity, LeadStatus } from '@/lib/portal/types';

const CONVERTIBLE: LeadStatus[] = ['QUALIFIED', 'QUOTATION', 'FOLLOW_UP'];
const SOURCES = ['Referral', 'Paid Ads', 'Campaign', 'Walk-in', 'Cold call', 'Social media', 'Website', 'Other'] as const;

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { can } = useSession();
  const lead = useQuery({ queryKey: ['lead', id], queryFn: () => getLead(id) });
  const [losing, setLosing] = useState(false);
  const [reason, setReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['lead', id] }), qc.invalidateQueries({ queryKey: ['leads'] })]);

  const status = useMutation({ mutationFn: (v: { s: LeadStatus; reason?: string }) => setLeadStatus(id, v.s, v.reason), onSuccess: async () => { setLosing(false); await refresh(); } });
  const log = useMutation({ mutationFn: (a: Omit<LeadActivity, 'id' | 'at'>) => logLeadActivity(id, a), onSuccess: refresh });
  const convert = useMutation({
    mutationFn: () => convertLead(id),
    onSuccess: async (c) => { await refresh(); await qc.invalidateQueries({ queryKey: ['customers'] }); router.push(`/app/customers/${c.id}`); },
  });
  const edit = useMutation({ mutationFn: (data: Parameters<typeof updateLead>[1]) => updateLead(id, data), onSuccess: async () => { setEditOpen(false); await refresh(); } });

  if (lead.isLoading) return <Loading />;
  if (!lead.data) return <ErrorNote error={lead.error} retry={() => void lead.refetch()} />;
  const l = lead.data;
  const [text, tone] = label(LEAD_STATUS, l.status);
  const canUpdate = can('lead:update');

  function submitLog(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const notes = String(f.get('notes') ?? '').trim();
    log.mutate({ type: f.get('type') as LeadActivity['type'], outcome: String(f.get('outcome')), ...(notes ? { notes } : {}) }, { onSuccess: () => (e.target as HTMLFormElement).reset() });
  }

  function submitEdit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    edit.mutate({
      name: (f['name'] ?? '').trim() || undefined,
      mobile: (f['mobile'] ?? '').trim() || undefined,
      email: (f['email'] ?? '').trim() || null,
      source: (f['source'] ?? '') || undefined,
      requirement: (f['requirement'] ?? '').trim() || null,
      notes: (f['notes'] ?? '').trim() || null,
    });
  }

  return (
    <>
      <PageHead back={{ href: '/app/leads', label: 'Leads' }} title={l.name}
        sub={<span className="flex flex-wrap items-center gap-2"><Badge tone={tone}>{text}</Badge><span className="tabular">{mobile(l.mobile)}</span></span>}
        actions={<>
          <a href={`tel:${l.mobile}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-ink ring-1 ring-line hover:ring-blue/40">Call</a>
          {canUpdate && <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit</Button>}
          {l.customerId ? <ButtonLink href={`/app/customers/${l.customerId}`}>Open customer</ButtonLink>
            : canUpdate && can('customer:create') && CONVERTIBLE.includes(l.status) && <Button busy={convert.isPending} onClick={() => convert.mutate()}>Convert to customer</Button>}
        </>} />
      <ErrorNote error={status.error ?? convert.error} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <Facts rows={[
              ['Source', l.source + (l.referralCode ? ` (${l.referralCode})` : '') + (l.campaign ? ` · ${l.campaign}` : '')],
              ['Email', l.email ?? '—'],
              ['Need', l.requirement ?? '—'],
              ['Notes', l.notes ?? '—'],
              ['Added', dateTime(l.createdAt)],
              ...(l.lostReason ? [['Lost because', l.lostReason] as [string, string]] : []),
            ]} />
          </Panel>
          {canUpdate && l.allowedTransitions.length > 0 && (
            <Panel title="Move to">
              <div className="flex flex-wrap gap-2">
                {l.allowedTransitions.filter((s) => s !== 'CONVERTED').map((s) => (
                  <Button key={s} variant={s === 'LOST' ? 'danger' : 'secondary'} disabled={status.isPending}
                    onClick={() => (s === 'LOST' ? setLosing(true) : status.mutate({ s }))}>{label(LEAD_STATUS, s)[0]}</Button>
                ))}
              </div>
              <p className="mt-3 text-[13.5px] text-muted">Only the next sensible steps are offered.</p>
            </Panel>
          )}
        </div>
        <div className="space-y-6">
          {canUpdate && l.status !== 'CONVERTED' && l.status !== 'LOST' && (
            <Panel title="Log a contact">
              <ErrorNote error={log.error} />
              <form onSubmit={submitLog} className="grid gap-4 sm:grid-cols-2">
                <Select label="How" name="type">{CONTACT_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
                <Select label="Outcome" name="outcome">{LEAD_OUTCOMES.map((t) => <option key={t}>{t}</option>)}</Select>
                <div className="sm:col-span-2"><Textarea label="Notes (optional)" name="notes" rows={2} /></div>
                <div><Button type="submit" busy={log.isPending}>Save contact</Button></div>
              </form>
            </Panel>
          )}
          <Panel title="Contact history">
            {l.activities.length ? (
              <ol className="-my-2 divide-y divide-line">
                {[...l.activities].sort((a, b) => b.at.localeCompare(a.at)).map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex justify-between gap-3"><span className="font-semibold text-ink">{a.type}: {a.outcome}</span><span className="text-[13px] text-muted">{dateTime(a.at)}</span></div>
                    {a.notes && <p className="mt-1 text-[14.5px] text-muted">{a.notes}</p>}
                  </li>
                ))}
              </ol>
            ) : <Empty title="No contact yet" text="Log each call or message so the next person knows where things stand." />}
          </Panel>
        </div>
      </div>

      {/* Edit lead dialog */}
      {editOpen && (
        <Dialog title="Edit lead" wide onClose={() => setEditOpen(false)} footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" form="lead-edit" busy={edit.isPending}>Save changes</Button></>}>
          <ErrorNote error={edit.error} />
          <form id="lead-edit" onSubmit={submitEdit} noValidate className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="name" defaultValue={l.name} required />
            <Input label="Mobile" name="mobile" type="tel" defaultValue={l.mobile} required />
            <Input label="Email (optional)" name="email" type="email" defaultValue={l.email ?? ''} />
            <Select label="Source" name="source" defaultValue={l.source}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <div className="sm:col-span-2">
              <Textarea label="Requirement / Need (optional)" name="requirement" rows={2} defaultValue={l.requirement ?? ''} />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Notes (optional)" name="notes" rows={2} defaultValue={l.notes ?? ''} />
            </div>
          </form>
        </Dialog>
      )}

      {losing && (
        <Dialog title={`Mark ${l.name} as lost?`} onClose={() => setLosing(false)} footer={<>
          <Button variant="secondary" onClick={() => setLosing(false)}>Cancel</Button>
          <Button variant="danger" disabled={reason.trim().length < 3} busy={status.isPending} onClick={() => status.mutate({ s: 'LOST', reason: reason.trim() })}>Mark as lost</Button>
        </>}>
          <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Bought from another advisor" />
        </Dialog>
      )}
    </>
  );
}
