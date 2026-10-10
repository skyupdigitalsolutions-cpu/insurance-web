'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';
import { mobile } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { Badge, Button, Dialog, Empty, ErrorNote, Input, Loading, Notice, PageHead, Panel, Segmented, Select, Table, Td } from '@/components/portal/ui';
import { createUser, listRoles, listUsers, saveRole, setUserActive } from '@/lib/portal/api';
import { ApiError } from '@/lib/portal/client';
import { PERMISSION_GROUPS } from '@/lib/portal/permissions';
import type { AppUser, Role } from '@/lib/portal/types';

const TABS = [['people', 'People'], ['roles', 'Roles']] as const;

export default function TeamPage() {
  const { me, can } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'people' | 'roles'>('people');
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState<AppUser | null>(null);
  const [editing, setEditing] = useState<Role | 'new' | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const users = useQuery({ queryKey: ['users'], queryFn: listUsers, enabled: can('user:manage') });
  const roles = useQuery({ queryKey: ['roles'], queryFn: listRoles, enabled: can('user:manage') });
  const add = useMutation({
    mutationFn: createUser,
    onSuccess: async (u) => { setAdding(false); setCreated(u); await qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err) => { if (err instanceof ApiError && err.details.length) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message]))); },
  });
  const active = useMutation({ mutationFn: (u: AppUser) => setUserActive(u.id, !u.active), onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) });

  if (!can('user:manage')) return <><PageHead title="Team" /><Panel><Empty title="Only the account owner manages the team" /></Panel></>;

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setErrors({});
    add.mutate({ name: (f.name ?? '').trim(), email: (f.email ?? '').trim(), mobile: f.mobile ?? '', roleId: f.roleId ?? '' });
  }

  return (
    <>
      <PageHead title="Team" sub="Office staff log in with their own account and see only what their role allows."
        actions={tab === 'people' ? <Button onClick={() => { setErrors({}); setAdding(true); }}>Add person</Button> : <Button onClick={() => setEditing('new')}>New role</Button>} />
      <div className="mb-4"><Segmented label="Section" value={tab} options={TABS} onChange={setTab} /></div>
      {created?.temporaryPassword && (
        <Notice tone="green">
          {created.name} was added and got an SMS with their login. Temporary password: <span className="tabular rounded bg-white px-2 py-0.5 font-semibold">{created.temporaryPassword}</span> (shown once; they must change it at first login).
        </Notice>
      )}
      <ErrorNote error={users.error ?? roles.error ?? active.error} />
      {tab === 'people' ? (users.isLoading ? <Loading /> : (
        <Table head={['Name', 'Mobile', 'Role', 'Status', '']}>
          {users.data?.map((u) => (
            <tr key={u.id}>
              <Td><span className="font-semibold">{u.name}</span>{u.id === me.id && <span className="text-muted"> (you)</span>}<span className="block text-[13px] text-muted">{u.email}</span></Td>
              <Td className="tabular whitespace-nowrap">{mobile(u.mobile)}</Td>
              <Td>{u.roleName}</Td>
              <Td>{u.active ? <Badge tone="green">Active</Badge> : <Badge tone="grey">Switched off</Badge>}</Td>
              <Td className="text-right">{u.id !== me.id && <Button variant={u.active ? 'danger' : 'secondary'} disabled={active.isPending} onClick={() => active.mutate(u)}>{u.active ? 'Switch off' : 'Switch on'}</Button>}</Td>
            </tr>
          ))}
        </Table>
      )) : (roles.isLoading ? <Loading /> : (
        <Table head={['Role', 'Can do', '']}>
          {roles.data?.map((r) => (
            <tr key={r.id}>
              <Td><span className="font-semibold">{r.name}</span>{r.system && <span className="block text-[13px] text-muted">Built in</span>}</Td>
              <Td className="text-muted">{r.permissions.length} permissions</Td>
              <Td className="text-right">{!r.system && <Button variant="secondary" onClick={() => setEditing(r)}>Edit</Button>}</Td>
            </tr>
          ))}
        </Table>
      ))}
      {adding && (
        <Dialog title="Add person" onClose={() => setAdding(false)} footer={<><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" form="user" busy={add.isPending}>Add and send login</Button></>}>
          {add.error && !(add.error instanceof ApiError && add.error.details.length) && <ErrorNote error={add.error} />}
          <form id="user" onSubmit={submit} className="grid gap-4">
            <Input label="Name" name="name" error={errors.name} />
            <Input label="Email (their login)" name="email" type="email" error={errors.email} />
            <Input label="Mobile (gets the SMS)" name="mobile" type="tel" error={errors.mobile} />
            <Select label="Role" name="roleId" error={errors.roleId}>{roles.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
          </form>
        </Dialog>
      )}
      {editing && <RoleDialog role={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function RoleDialog({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(role?.name ?? '');
  const [perms, setPerms] = useState<string[]>(role?.permissions ?? ['dashboard:read']);
  const save = useMutation({ mutationFn: () => saveRole({ id: role?.id, name: name.trim(), permissions: perms }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['roles'] }); onClose(); } });
  const toggle = (c: string) => setPerms((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  return (
    <Dialog wide title={role ? `Edit ${role.name}` : 'New role'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={name.trim().length < 2 || !perms.length} busy={save.isPending} onClick={() => save.mutate()}>Save role</Button></>}>
      <ErrorNote error={save.error} />
      <Input label="Role name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {PERMISSION_GROUPS.map((g) => (
          <fieldset key={g.area}>
            <legend className="text-[14px] font-semibold text-ink">{g.area}</legend>
            {g.items.map((i) => (
              <label key={i.code} className="mt-1.5 flex items-center gap-2 text-[14.5px] text-[#43526b]">
                <input type="checkbox" className="h-4 w-4 accent-[#3a75c4]" checked={perms.includes(i.code)} onChange={() => toggle(i.code)} />{i.label}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </Dialog>
  );
}
