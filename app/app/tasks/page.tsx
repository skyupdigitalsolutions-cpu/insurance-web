'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';
import { dateTime } from '@/components/portal/format';
import { TASK_TYPES } from '@/components/portal/options';
import { Badge, Button, Dialog, Empty, ErrorNote, Input, Loading, PageHead, Segmented, Select } from '@/components/portal/ui';
import { createTask, listTasks, setTaskDone } from '@/lib/portal/api';
import type { Task, TaskType } from '@/lib/portal/types';

const TABS = [['today', 'Today'], ['overdue', 'Overdue'], ['upcoming', 'Upcoming'], ['done', 'Done']] as const;
type TabKey = (typeof TABS)[number][0];

// Start and end of today in India time
const istDay = () => {
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  return [new Date(`${d}T00:00:00+05:30`).getTime(), new Date(`${d}T23:59:59+05:30`).getTime()] as const;
};
function bucket(t: Task): TabKey {
  if (t.done) return 'done';
  const [start, end] = istDay();
  const due = new Date(t.due).getTime();
  return due < start ? 'overdue' : due <= end ? 'today' : 'upcoming';
}
// Tomorrow 10:00 India time as a value for <input type="datetime-local">
const tomorrow10 = () => `${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(Date.now() + 86_400_000))}T10:00`;

export default function TasksPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>('today');
  const [adding, setAdding] = useState(false);
  const tasks = useQuery({ queryKey: ['tasks'], queryFn: listTasks });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['tasks'] }), qc.invalidateQueries({ queryKey: ['pending-actions'] })]);
  const toggle = useMutation({ mutationFn: (t: Task) => setTaskDone(t.id, !t.done), onSuccess: refresh });
  const add = useMutation({ mutationFn: createTask, onSuccess: async () => { setAdding(false); await refresh(); } });
  const counts = Object.fromEntries(TABS.map(([k]) => [k, tasks.data?.filter((t) => bucket(t) === k).length ?? 0]));
  const items = (tasks.data ?? []).filter((t) => bucket(t) === tab).sort((a, b) => a.due.localeCompare(b.due));

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    add.mutate({ title: (f.title ?? '').trim(), type: f.type as TaskType, due: new Date(`${f.due}:00+05:30`).toISOString(), relatedTo: (f.relatedTo ?? '').trim() || undefined });
  }

  return (
    <>
      <PageHead title="Tasks" sub="Calls, visits and follow-ups. Reminder jobs and Autodial add tasks here too." actions={<Button onClick={() => setAdding(true)}>Add task</Button>} />
      <div className="mb-4"><Segmented label="Show" value={tab} options={TABS.map(([k, l]) => [k, `${l} (${counts[k] ?? 0})`] as const)} onChange={setTab} /></div>
      <ErrorNote error={tasks.error ?? toggle.error} retry={() => void tasks.refetch()} />
      {tasks.isLoading ? <Loading /> : (
        <div className="rounded-2xl bg-white ring-1 ring-line">
          {items.length ? (
            <ul className="divide-y divide-line">{items.map((t) => (
              <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <input type="checkbox" checked={t.done} onChange={() => toggle.mutate(t)} aria-label={`Mark "${t.title}" ${t.done ? 'not done' : 'done'}`} className="h-5 w-5 accent-[#3a75c4]" />
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold ${t.done ? 'text-muted line-through' : 'text-ink'}`}>{t.title}</span>
                  <span className="block text-[13.5px] text-muted">{t.type}{t.relatedTo ? ` · ${t.relatedTo}` : ''}</span>
                </span>
                {bucket(t) === 'overdue' ? <Badge tone="red">{dateTime(t.due)}</Badge> : <span className="text-[13.5px] text-muted">{dateTime(t.due)}</span>}
              </li>
            ))}</ul>
          ) : <Empty title={tab === 'done' ? 'Nothing finished yet' : 'Nothing here'} text={tab === 'overdue' ? 'No overdue tasks. Well done.' : undefined} />}
        </div>
      )}
      {adding && (
        <Dialog title="Add task" onClose={() => setAdding(false)} footer={<><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" form="task" busy={add.isPending}>Save task</Button></>}>
          <ErrorNote error={add.error} />
          <form id="task" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Input label="What" name="title" required placeholder="e.g. Collect PAN copy from Sneha" /></div>
            <Select label="Type" name="type">{TASK_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            <Input label="Due" name="due" type="datetime-local" required defaultValue={tomorrow10()} />
            <div className="sm:col-span-2"><Input label="Related to (optional)" name="relatedTo" placeholder="e.g. Customer: Sneha Rao" /></div>
          </form>
        </Dialog>
      )}
    </>
  );
}
