'use client';

// The sections of a customer file
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRef, useState, type SyntheticEvent } from 'react';
import {
  addFamily, addNominee, getNeed, listDocuments, listFamily, listNominees, listPolicies, listQuotes, recommendations, removeNominee,
  reviewDocument, saveNeed, uploadDocument,
} from '@/lib/portal/api';
import type { InsuranceType } from '@/lib/portal/types';
import { date, dateTime, rupees } from '../format';
import { DOC_STATUS, DOC_TYPES, FAMILY_RELATIONSHIPS, INSURANCE_TYPES, POLICY_STATUS, QUOTE_STATUS, label } from '../options';
import { useSession } from '../session';
import { Badge, Button, ButtonLink, Dialog, Empty, ErrorNote, Input, Loading, Panel, RowLink, Select, Table, Td, Textarea, UpgradeNote } from '../ui';

const formObj = (e: SyntheticEvent<HTMLFormElement>) => Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
const num = (v: string | undefined) => (v && v.trim() !== '' ? Number(v.replace(/[,\s]/g, '')) : undefined);

export function FamilyPanel({ customerId }: { customerId: string }) {
  const qc = useQueryClient();
  const { can } = useSession();
  const [open, setOpen] = useState(false);
  const family = useQuery({ queryKey: ['family', customerId], queryFn: () => listFamily(customerId) });
  const add = useMutation({ mutationFn: addFamily, onSuccess: async () => { setOpen(false); await qc.invalidateQueries({ queryKey: ['family', customerId] }); } });
  return (
    <Panel title="Family members" actions={can('customer:update') && <Button variant="quiet" onClick={() => setOpen(true)}>Add</Button>}>
      {family.isLoading ? <Loading /> : family.data?.length ? (
        <ul className="-my-2 divide-y divide-line">{family.data.map((m) => (
          <li key={m.id} className="flex justify-between gap-3 py-2.5"><span className="font-semibold text-ink">{m.name}</span><span className="text-muted">{m.relationship}{m.dob ? ` · ${date(m.dob)}` : ''}</span></li>
        ))}</ul>
      ) : <Empty title="No family members" text="Add the people a family health cover would include." />}
      {open && (
        <Dialog title="Add family member" onClose={() => setOpen(false)} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="fam" busy={add.isPending}>Add</Button></>}>
          <ErrorNote error={add.error} />
          <form id="fam" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); const f = formObj(e); add.mutate({ customerId, name: (f.name ?? '').trim(), relationship: f.relationship ?? 'Spouse', ...(f.dob ? { dob: f.dob } : {}) }); }}>
            <Input label="Name" name="name" required minLength={2} />
            <Select label="Relationship" name="relationship">{FAMILY_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}</Select>
            <Input label="Date of birth (optional)" name="dob" type="date" max={new Date().toISOString().slice(0, 10)} />
          </form>
        </Dialog>
      )}
    </Panel>
  );
}

export function NomineesPanel({ customerId }: { customerId: string }) {
  const qc = useQueryClient();
  const { can } = useSession();
  const [open, setOpen] = useState(false);
  const nominees = useQuery({ queryKey: ['nominees', customerId], queryFn: () => listNominees(customerId) });
  const done = async () => { setOpen(false); await qc.invalidateQueries({ queryKey: ['nominees', customerId] }); };
  const add = useMutation({ mutationFn: addNominee, onSuccess: done });
  const remove = useMutation({ mutationFn: removeNominee, onSuccess: done });
  const total = nominees.data?.reduce((s, n) => s + n.percent, 0) ?? 0;
  return (
    <Panel title="Nominees" actions={can('customer:update') && total < 100 && <Button variant="quiet" onClick={() => setOpen(true)}>Add</Button>}>
      <ErrorNote error={remove.error} />
      {nominees.isLoading ? <Loading /> : nominees.data?.length ? (
        <>
          <ul className="-my-2 divide-y divide-line">{nominees.data.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 py-2.5">
              <span><span className="font-semibold text-ink">{n.name}</span> <span className="text-muted">({n.relationship})</span></span>
              <span className="flex items-center gap-3"><span className="tabular font-semibold">{n.percent}%</span>
                {can('customer:update') && <Button variant="quiet" onClick={() => remove.mutate(n.id)} aria-label={`Remove ${n.name}`}>Remove</Button>}</span>
            </li>
          ))}</ul>
          <p className={`mt-3 text-[14px] font-semibold ${total === 100 ? 'text-[#1e7a4f]' : 'text-[#94590a]'}`}>Total share: {total}%{total !== 100 && ' (should add up to 100%)'}</p>
        </>
      ) : <Empty title="No nominees" text="Shares must add up to 100%." />}
      {open && (
        <Dialog title="Add nominee" onClose={() => setOpen(false)} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="nom" busy={add.isPending}>Add</Button></>}>
          <ErrorNote error={add.error} />
          <form id="nom" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); const f = formObj(e); add.mutate({ customerId, name: (f.name ?? '').trim(), relationship: f.relationship ?? 'Spouse', percent: Number(f.percent) }); }}>
            <Input label="Name" name="name" required minLength={2} />
            <Select label="Relationship" name="relationship">{FAMILY_RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}</Select>
            <Input label="Share (%)" name="percent" type="number" min={1} max={100 - total} defaultValue={100 - total} hint={`Up to ${100 - total}% is left`} />
          </form>
        </Dialog>
      )}
    </Panel>
  );
}

export function NeedPanel({ customerId }: { customerId: string }) {
  const qc = useQueryClient();
  const { can, has } = useSession();
  const need = useQuery({ queryKey: ['need', customerId], queryFn: () => getNeed(customerId) });
  const [editing, setEditing] = useState(false);
  const [ask, setAsk] = useState(false);
  const save = useMutation({ mutationFn: saveNeed, onSuccess: async () => { setEditing(false); await qc.invalidateQueries({ queryKey: ['need', customerId] }); } });
  const recs = useQuery({ queryKey: ['recs', customerId, need.data?.updatedAt], queryFn: () => recommendations(customerId), enabled: ask && !!need.data });
  const n = need.data;
  return (
    <div className="space-y-6">
      <Panel title="Need analysis" actions={can('customer:update') && <Button variant="quiet" onClick={() => setEditing(true)}>{n ? 'Edit' : 'Record need'}</Button>}>
        {need.isLoading ? <Loading /> : n ? (
          <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
            {([['Insurance', n.insuranceType], ['Need', n.need], ['Cover wanted', n.coverage != null ? rupees(n.coverage) : '—'], ['Budget per year', n.budget != null ? rupees(n.budget) : '—'],
              ['Members', n.members ?? '—'], ['Updated', dateTime(n.updatedAt)]] as [string, string | number][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line py-2"><dt className="text-muted">{k}</dt><dd className="text-right text-ink">{v}</dd></div>
            ))}
          </dl>
        ) : <Empty title="Not recorded yet" text="Record what the customer needs and their budget. Suggestions use it." />}
      </Panel>
      {n && (has('ai') ? (
        <Panel title="Suggested products" actions={!ask && <Button onClick={() => setAsk(true)}>Suggest products</Button>}>
          {!ask ? <p className="text-muted">Suggestions use only the published product details and this need. You decide what to offer.</p>
            : recs.isLoading ? <Loading /> : recs.error ? <ErrorNote error={recs.error} retry={() => void recs.refetch()} /> : recs.data?.length ? (
              <ol className="space-y-3">{recs.data.map((r, i) => (
                <li key={r.product.id} className="rounded-xl p-4 ring-1 ring-line">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><span className="tabular mr-2 font-display font-semibold text-blue">{i + 1}</span><span className="font-semibold text-ink">{r.product.name}</span>
                      <span className="block text-[14px] text-muted">{r.product.companyName} · {r.product.basePremium != null ? `${rupees(r.product.basePremium)} per year` : 'Premium not available'}</span></div>
                    {can('quotation:create') && <ButtonLink href={`/app/quotations/new?customerId=${customerId}&productId=${r.product.id}`} variant="secondary">Quote this</ButtonLink>}
                  </div>
                  <ul className="mt-2 space-y-1 text-[14px]">
                    {r.reasons.map((x) => <li key={x} className="text-[#1e7a4f]">✓ {x}</li>)}
                    {r.warnings.map((x) => <li key={x} className="text-[#94590a]">⚠ {x}</li>)}
                  </ul>
                </li>
              ))}</ol>
            ) : <Empty title="No suitable products" text="No published product matches this need. Try a different insurance type or budget." />}
        </Panel>
      ) : <UpgradeNote feature="AI suggestions" />)}
      {editing && (
        <Dialog title="Need analysis" onClose={() => setEditing(false)} footer={<><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" form="need" busy={save.isPending}>Save</Button></>}>
          <ErrorNote error={save.error} />
          <form id="need" className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
            e.preventDefault(); const f = formObj(e);
            save.mutate({ customerId, insuranceType: f.insuranceType as InsuranceType, need: (f.need ?? '').trim(), coverage: num(f.coverage), budget: num(f.budget), members: num(f.members), notes: (f.notes ?? '').trim() || undefined });
          }}>
            <Select label="Insurance type" name="insuranceType" defaultValue={n?.insuranceType ?? 'Health'}>{INSURANCE_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            <Input label="Members to cover" name="members" type="number" min={1} max={20} defaultValue={n?.members} />
            <div className="sm:col-span-2"><Input label="What do they need?" name="need" required defaultValue={n?.need} placeholder="e.g. Family floater with maternity" /></div>
            <Input label="Cover wanted (₹)" name="coverage" inputMode="numeric" defaultValue={n?.coverage} />
            <Input label="Budget per year (₹)" name="budget" inputMode="numeric" defaultValue={n?.budget} />
            <div className="sm:col-span-2"><Textarea label="Notes (optional)" name="notes" defaultValue={n?.notes} /></div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export function DocumentsPanel({ customerId }: { customerId: string }) {
  const qc = useQueryClient();
  const { can } = useSession();
  const file = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<string>(DOC_TYPES[0]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const docs = useQuery({ queryKey: ['documents', customerId], queryFn: () => listDocuments(customerId) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['documents', customerId] });
  const upload = useMutation({ mutationFn: (f: File) => uploadDocument(customerId, type, f), onSuccess: async () => { if (file.current) file.current.value = ''; await refresh(); } });
  const review = useMutation({ mutationFn: (v: { id: string; ok: boolean; reason?: string }) => reviewDocument(v.id, v.ok, v.reason), onSuccess: async () => { setRejecting(null); setReason(''); await refresh(); } });

  return (
    <Panel title="KYC documents">
      {can('customer:update') && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl bg-paper p-4">
          <div className="w-44"><Select label="Document" value={type} onChange={(e) => setType(e.target.value)}>{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div>
          <div>
            <label className="block text-[14px] font-semibold text-ink" htmlFor="doc-file">File</label>
            <input id="doc-file" ref={file} type="file" accept="image/jpeg,image/png,application/pdf" className="mt-1.5 block text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-ink file:ring-1 file:ring-line"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); }} />
          </div>
          <p className="text-[13px] text-muted">{upload.isPending ? 'Uploading…' : 'JPG, PNG or PDF, up to 10 MB. Files are private.'}</p>
        </div>
      )}
      <ErrorNote error={upload.error ?? review.error} />
      {docs.isLoading ? <Loading /> : docs.data?.length ? (
        <ul className="-my-2 divide-y divide-line">{docs.data.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span><span className="font-semibold text-ink">{d.type}</span> <Badge tone={DOC_STATUS[d.status] ?? 'grey'}>{d.status}</Badge>
              <span className="block text-[13px] text-muted">Uploaded {dateTime(d.uploadedAt)}{d.rejectReason ? ` · Rejected: ${d.rejectReason}` : ''}</span></span>
            <span className="flex gap-2">
              {/* The link is signed and works for 15 minutes; refreshing the list makes a new one */}
              <a href={d.uri} target="_blank" rel="noopener noreferrer" className="rounded-full px-3 py-1.5 text-[14px] font-semibold text-blue-deep hover:bg-mist" onClick={() => setTimeout(() => void refresh(), 1000)}>View</a>
              {can('customer:update') && d.status !== 'Verified' && d.status !== 'Rejected' && <>
                <Button variant="secondary" onClick={() => review.mutate({ id: d.id, ok: true })}>Verify</Button>
                <Button variant="danger" onClick={() => setRejecting(d.id)}>Reject</Button>
              </>}
            </span>
          </li>
        ))}</ul>
      ) : <Empty title="No documents yet" text="Upload Aadhaar, PAN or other KYC documents. Policies need verified documents before they are issued." />}
      {rejecting && (
        <Dialog title="Reject document" onClose={() => setRejecting(null)} footer={<><Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
          <Button variant="danger" disabled={reason.trim().length < 3} busy={review.isPending} onClick={() => review.mutate({ id: rejecting, ok: false, reason: reason.trim() })}>Reject</Button></>}>
          <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Photo is blurred, upload again" />
        </Dialog>
      )}
    </Panel>
  );
}

export function SalesPanel({ customerId }: { customerId: string }) {
  const { can } = useSession();
  const quotes = useQuery({ queryKey: ['quotes', customerId], queryFn: () => listQuotes(customerId), enabled: can('quotation:read') });
  const policies = useQuery({ queryKey: ['policies', customerId], queryFn: () => listPolicies({ customerId }), enabled: can('policy:read') });
  return (
    <div className="space-y-6">
      {can('quotation:read') && (
        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-[18px] font-semibold">Quotations</h2>
            {can('quotation:create') && <ButtonLink href={`/app/quotations/new?customerId=${customerId}`}>New quotation</ButtonLink>}</div>
          {quotes.isLoading ? <Loading /> : (
            <Table head={['Number', 'Product', 'Total', 'Status', 'Created']} empty={!quotes.data?.length && <Empty title="No quotations yet" />}>
              {quotes.data?.map((q) => { const [t, tone] = label(QUOTE_STATUS, q.status); return (
                <tr key={q.id}><Td><RowLink href={`/app/quotations/${q.id}`}>{q.quoteNumber}</RowLink></Td><Td>{q.productName}<span className="block text-[13px] text-muted">{q.companyName}</span></Td>
                  <Td className="tabular">{rupees(q.pricing.total)}</Td><Td><Badge tone={tone}>{t}</Badge></Td><Td className="text-muted">{date(q.createdAt)}</Td></tr>); })}
            </Table>
          )}
        </div>
      )}
      {can('policy:read') && (
        <div>
          <h2 className="mb-3 font-display text-[18px] font-semibold">Policies</h2>
          {policies.isLoading ? <Loading /> : (
            <Table head={['Policy', 'Product', 'Premium', 'Status', 'Renews on']} empty={!policies.data?.length && <Empty title="No policies yet" />}>
              {policies.data?.map((p) => { const [t, tone] = label(POLICY_STATUS, p.status); return (
                <tr key={p.id}><Td><RowLink href={`/app/policies/${p.id}`}>{p.policyNumber ?? 'Not issued yet'}</RowLink></Td><Td>{p.productName}<span className="block text-[13px] text-muted">{p.companyName}</span></Td>
                  <Td className="tabular">{rupees(p.premium)}</Td><Td><Badge tone={tone}>{t}</Badge></Td><Td>{date(p.endDate)}</Td></tr>); })}
            </Table>
          )}
        </div>
      )}
      {!can('quotation:read') && !can('policy:read') && <Empty title="Nothing to show" text="Your role cannot see quotations or policies." />}
      <p className="text-[13.5px] text-muted">Need to send a message? Use <Link href="/app/messages" className="font-semibold text-blue-deep">Messages</Link>.</p>
    </div>
  );
}
