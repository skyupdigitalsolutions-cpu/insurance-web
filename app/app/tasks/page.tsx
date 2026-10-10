'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { dateTime } from '@/components/portal/format';
import { TASK_TYPES } from '@/components/portal/options';
import { Badge, Button, Dialog, Empty, ErrorNote, Input, Loading, PageHead, Segmented, Select } from '@/components/portal/ui';
import { createTask, listTasks, setTaskDone, updateTask } from '@/lib/portal/api';
import type { Task, TaskType } from '@/lib/portal/types';

const TABS = [['today', 'Today'], ['overdue', 'Overdue'], ['upcoming', 'Upcoming'], ['done', 'Done']] as const;
type TabKey = (typeof TABS)[number][0];

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
const tomorrow10 = () => `${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(Date.now() + 86_400_000))}T10:00`;
const toLocal = (iso: string) => iso.slice(0, 16);

function Toast({ title, onDone }: { title: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 animate-drop-in">
      <div className="flex items-center gap-3 rounded-2xl bg-green-600 px-6 py-4 shadow-2xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-green-600 text-lg font-bold">✓</span>
        <div>
          <p className="font-semibold text-white text-[15px]">Task Completed!</p>
          <p className="text-green-100 text-[13px] max-w-[220px] truncate">"{title}"</p>
        </div>
        <button onClick={onDone} className="ml-2 text-green-200 hover:text-white text-lg leading-none">×</button>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>('today');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const tasks = useQuery({ queryKey: ['tasks'], queryFn: listTasks });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['tasks'] }), qc.invalidateQueries({ queryKey: ['pending-actions'] })]);

  const toggle = useMutation({
    mutationFn: (t: Task) => setTaskDone(t.id, !t.done),
    onSuccess: async (_, task) => { await refresh(); if (!task.done) setToast(task.title); },
  });
  const add = useMutation({ mutationFn: createTask, onSuccess: async () => { setAdding(false); await refresh(); } });
  const edit = useMutation({ mutationFn: (v: { id: string; data: Parameters<typeof updateTask>[1] }) => updateTask(v.id, v.data), onSuccess: async () => { setEditing(null); await refresh(); } });

  const counts = Object.fromEntries(TABS.map(([k]) => [k, tasks.data?.filter((t) => bucket(t) === k).length ?? 0]));
  const items = (tasks.data ?? []).filter((t) => bucket(t) === tab).sort((a, b) => a.due.localeCompare(b.due));

  function submitAdd(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    add.mutate({ title: (f.title ?? '').trim(), type: f.type as TaskType, due: new Date(`${f.due}:00+05:30`).toISOString(), relatedTo: (f.relatedTo ?? '').trim() || undefined });
  }

  function submitEdit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    edit.mutate({ id: editing.id, data: { title: (f['title'] ?? '').trim(), type: f['type'], due: new Date(`${f['due']}:00+05:30`).toISOString(), relatedTo: (f['relatedTo'] ?? '').trim() || null } });
  }

  return (
    <>
      <PageHead back={{ href: '/app', label: 'Dashboard' }} title="Tasks" sub="Calls, visits and follow-ups. Reminder jobs and Autodial add tasks here too." actions={<Button onClick={() => setAdding(true)}>Add task</Button>} />
      <div className="mb-4"><Segmented label="Show" value={tab} options={TABS.map(([k, l]) => [k, `${l} (${counts[k] ?? 0})`] as const)} onChange={setTab} /></div>
      <ErrorNote error={tasks.error ?? toggle.error ?? edit.error} retry={() => void tasks.refetch()} />
      {tasks.isLoading ? <Loading /> : (
        <div className="rounded-2xl bg-white ring-1 ring-line">
          {items.length ? (
            <ul className="divide-y divide-line">
              {items.map((t) => (
                <li key={t.id} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${t.done ? 'bg-[#f8faf8]' : 'hover:bg-[#f7f8fb]'}`}>
                  <input type="checkbox" checked={t.done} onChange={() => toggle.mutate(t)} aria-label={`Mark "${t.title}" ${t.done ? 'not done' : 'done'}`} className="h-5 w-5 accent-[#3a75c4] cursor-pointer" />
                  <span className="min-w-0 flex-1">
                    <span className={`block font-semibold ${t.done ? 'text-muted line-through' : 'text-ink'}`}>{t.title}</span>
                    <span className="block text-[13.5px] text-muted">{t.type}{t.relatedTo ? ` · ${t.relatedTo}` : ''}</span>
                  </span>
                  {t.done
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-[12px] font-semibold text-green-700">✓ Completed</span>
                    : bucket(t) === 'overdue' ? <Badge tone="red">{dateTime(t.due)}</Badge>
                    : <span className="text-[13.5px] text-muted">{dateTime(t.due)}</span>
                  }
                  {!t.done && (
                    <button onClick={() => setEditing(t)} className="ml-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-blue-deep hover:bg-blue-50 transition-colors">Edit</button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty title={tab === 'done' ? 'No completed tasks yet' : tab === 'overdue' ? 'No overdue tasks. Well done.' : 'Nothing here'} text={tab === 'done' ? 'Check the checkbox on any task to mark it as completed.' : tab === 'today' ? 'No tasks due today.' : undefined} />
          )}
        </div>
      )}

      {toast && <Toast title={toast} onDone={() => setToast(null)} />}

      {adding && (
        <Dialog title="Add task" onClose={() => setAdding(false)} footer={<><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" form="task-add" busy={add.isPending}>Save task</Button></>}>
          <ErrorNote error={add.error} />
          <form id="task-add" onSubmit={submitAdd} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Input label="What" name="title" required placeholder="e.g. Collect PAN copy from Sneha" /></div>
            <Select label="Type" name="type">{TASK_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            <Input label="Due" name="due" type="datetime-local" required defaultValue={tomorrow10()} />
            <div className="sm:col-span-2"><Input label="Related to (optional)" name="relatedTo" placeholder="e.g. Customer: Sneha Rao" /></div>
          </form>
        </Dialog>
      )}

      {editing && (
        <Dialog title="Edit task" onClose={() => setEditing(null)} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="task-edit" busy={edit.isPending}>Save changes</Button></>}>
          <ErrorNote error={edit.error} />
          <form id="task-edit" onSubmit={submitEdit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Input label="What" name="title" required defaultValue={editing.title} /></div>
            <Select label="Type" name="type" defaultValue={editing.type}>{TASK_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            <Input label="Due" name="due" type="datetime-local" required defaultValue={toLocal(editing.due)} />
            <div className="sm:col-span-2"><Input label="Related to (optional)" name="relatedTo" defaultValue={editing.relatedTo ?? ''} placeholder="e.g. Customer: Sneha Rao" /></div>
          </form>
        </Dialog>
      )}
    </>
  );
}
