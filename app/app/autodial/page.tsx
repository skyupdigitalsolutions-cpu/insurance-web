'use client';

// Autodial on the web: work through a call list one person at a time. The browser cannot place the call itself,
// so "Call" opens your phone app (tel: link, or a linked phone on Windows/Mac); the outcome is saved here.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { dateTime, mobile } from '@/components/portal/format';
import { CALL_OUTCOMES } from '@/components/portal/options';
import { useSession } from '@/components/portal/session';
import { Badge, Button, Empty, ErrorNote, Loading, Notice, PageHead, Panel, Segmented, Table, Td, Textarea, UpgradeNote } from '@/components/portal/ui';
import { callLogs, callQueue, logCall } from '@/lib/portal/api';
import type { AutodialList, CallOutcome } from '@/lib/portal/types';

const LISTS = [['new_leads', 'New leads'], ['open_leads', 'Open leads'], ['renewals', 'Renewals due']] as const;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function AutodialPage() {
  const { has } = useSession();
  const qc = useQueryClient();
  const [list, setList] = useState<AutodialList>('new_leads');
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const queue = useQuery({ queryKey: ['autodial', list], queryFn: () => callQueue(list), enabled: has('autodial') });
  const logs = useQuery({ queryKey: ['call-logs'], queryFn: callLogs, enabled: has('autodial') });
  const item = queue.data?.[index];

  useEffect(() => {
    if (startedAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const save = useMutation({
    mutationFn: () => logCall(item!, outcome!, notes.trim() || undefined, startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0),
    onSuccess: async () => {
      setSaved(`${item!.name}: ${outcome}${outcome === 'Call back' ? ' (task added for tomorrow 10:00)' : ''}`);
      setOutcome(null); setNotes(''); setStartedAt(null); setIndex((i) => i + 1);
      await Promise.all([qc.invalidateQueries({ queryKey: ['call-logs'] }), qc.invalidateQueries({ queryKey: ['tasks'] })]);
    },
  });

  if (!has('autodial')) return <><PageHead title="Autodial" /><UpgradeNote feature="Autodial" /></>;
  const elapsed = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;

  return (
    <>
      <PageHead title="Autodial" sub="Work through a call list one person at a time. Each outcome is saved on the lead or renewal." />
      <div className="mb-5"><Segmented label="List" value={list} options={LISTS} onChange={(l) => { setList(l); setIndex(0); setStartedAt(null); setSaved(null); }} /></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title={queue.data ? `Call ${Math.min(index + 1, queue.data.length)} of ${queue.data.length}` : 'Call list'}>
          {saved && <Notice tone="green">Saved: {saved}</Notice>}
          <ErrorNote error={queue.error ?? save.error} retry={() => void queue.refetch()} />
          {queue.isLoading ? <Loading /> : item ? (
            <div>
              <p className="font-display text-[26px] font-semibold text-ink">{item.name}</p>
              <p className="text-muted">{item.subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a href={`tel:${item.mobile}`} onClick={() => setStartedAt(Date.now())} className="rounded-full bg-[#1e8e5a] px-5 py-2.5 font-semibold text-white hover:bg-[#177049]">Call {mobile(item.mobile)}</a>
                {startedAt && <span className="tabular rounded-full bg-paper px-3 py-1.5 font-semibold text-ink" aria-live="off">{mmss(elapsed)}</span>}
                <Button variant="quiet" onClick={() => { setIndex(index + 1); setStartedAt(null); setOutcome(null); }}>Skip</Button>
              </div>
              <fieldset className="mt-6">
                <legend className="text-[14px] font-semibold text-ink">How did it go?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CALL_OUTCOMES.map((o) => (
                    <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(o)}
                      className={`rounded-full px-3.5 py-1.5 text-[14px] font-semibold ring-1 ${outcome === o ? 'bg-blue text-white ring-blue' : 'bg-white text-ink ring-line hover:ring-blue/40'}`}>{o}</button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-4"><Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
              <Button className="mt-4" disabled={!outcome} busy={save.isPending} onClick={() => save.mutate()}>Save and next</Button>
            </div>
          ) : <Empty title={queue.data?.length ? 'List finished' : 'Nobody to call in this list'} text={queue.data?.length ? 'Every call in this list is done. Pick another list or come back later.' : undefined}
              action={queue.data?.length ? <Button variant="secondary" onClick={() => { setIndex(0); void queue.refetch(); }}>Start again</Button> : undefined} />}
        </Panel>
        <div>
          <h2 className="mb-3 font-display text-[18px] font-semibold">Recent calls</h2>
          {logs.isLoading ? <Loading /> : (
            <Table head={['Name', 'Outcome', 'Length', 'When']} empty={!logs.data?.length && <Empty title="No calls logged yet" />}>
              {logs.data?.slice(0, 20).map((c) => (
                <tr key={c.id}><Td>{c.name}<span className="block text-[13px] text-muted">{c.kind === 'lead' ? 'Lead' : 'Renewal'}</span></Td>
                  <Td><Badge tone={c.outcome === 'Connected' ? 'green' : c.outcome === 'Call back' ? 'amber' : 'grey'}>{c.outcome}</Badge></Td>
                  <Td className="tabular">{mmss(c.durationSec)}</Td><Td className="whitespace-nowrap text-muted">{dateTime(c.at)}</Td></tr>
              ))}
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
