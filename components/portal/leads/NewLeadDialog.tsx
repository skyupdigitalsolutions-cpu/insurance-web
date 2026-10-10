'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { createLead, duplicateLead } from '@/lib/portal/api';
import { ApiError } from '@/lib/portal/client';
import type { Lead, LeadSource } from '@/lib/portal/types';
import { LEAD_SOURCES } from '../options';
import { Button, Dialog, ErrorNote, Input, Select, Textarea } from '../ui';

type Errors = Partial<Record<'name' | 'mobile' | 'email' | 'referralCode' | 'campaign', string>>;

export function NewLeadDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [source, setSource] = useState<LeadSource>('Referral');
  const [errors, setErrors] = useState<Errors>({});
  const [duplicate, setDuplicate] = useState<Lead | null>(null);
  const save = useMutation({
    mutationFn: createLead,
    onSuccess: async (lead) => { await qc.invalidateQueries({ queryKey: ['leads'] }); router.push(`/app/leads/${lead.id}`); },
    onError: (err) => {
      if (err instanceof ApiError && err.details.length) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])) as Errors);
    },
  });

  async function checkDuplicate(m: string) {
    if (!/^(\+?91)?[6-9]\d{9}$/.test(m.replace(/[\s-]/g, ''))) return;
    try { setDuplicate(await duplicateLead(m)); } catch { /* checked again by the server on save */ }
  }

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const local: Errors = {};
    if ((f.name ?? '').trim().length < 2) local.name = 'Enter the name';
    if (!/^(\+?91)?[6-9]\d{9}$/.test((f.mobile ?? '').replace(/[\s-]/g, ''))) local.mobile = 'Enter a 10-digit Indian mobile number';
    if (source === 'Campaign' && !(f.campaign ?? '').trim()) local.campaign = 'Which campaign?';
    if (source === 'Referral' && !(f.referralCode ?? '').trim()) local.referralCode = 'Enter the referral code (or record it under Referrals)';
    setErrors(local);
    if (Object.keys(local).length) return;
    const opt = (k: string) => ((f[k] ?? '').trim() ? (f[k] ?? '').trim() : undefined);
    save.mutate({ name: f.name!.trim(), mobile: f.mobile!, source, email: opt('email'), referralCode: opt('referralCode'), campaign: opt('campaign'), requirement: opt('requirement'), notes: opt('notes') });
  }

  return (
    <Dialog title="Add lead" onClose={onClose} wide footer={<>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button type="submit" form="new-lead" busy={save.isPending}>Save lead</Button>
    </>}>
      {save.error && !(save.error instanceof ApiError && save.error.details.length) && <ErrorNote error={save.error} />}
      <form id="new-lead" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" name="name" autoComplete="off" error={errors.name} />
        <Input label="Mobile" name="mobile" type="tel" inputMode="tel" placeholder="98765 43210" error={errors.mobile} onBlur={(e) => void checkDuplicate(e.target.value)} />
        {duplicate && (
          <p role="status" className="rounded-xl bg-[#fdf0db] px-4 py-3 text-[14.5px] text-[#7a4a08] sm:col-span-2">
            {duplicate.name} already has this number. <Link className="font-semibold underline" href={`/app/leads/${duplicate.id}`}>Open that lead</Link>
          </p>
        )}
        <Input label="Email (optional)" name="email" type="email" error={errors.email} />
        <Select label="Source" name="source" value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>
          {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        {source === 'Referral' && <Input label="Referral code" name="referralCode" error={errors.referralCode} hint="Referred by an existing customer? Use Referrals instead." />}
        {source === 'Campaign' && <Input label="Campaign" name="campaign" error={errors.campaign} />}
        <div className="sm:col-span-2"><Input label="What do they need?" name="requirement" placeholder="e.g. Family health cover for 4" /></div>
        <div className="sm:col-span-2"><Textarea label="Notes (optional)" name="notes" /></div>
      </form>
    </Dialog>
  );
}
