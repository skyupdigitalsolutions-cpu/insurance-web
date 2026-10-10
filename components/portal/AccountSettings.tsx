'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { changePassword } from '@/lib/portal/api';
import { mobile } from './format';
import { useSession } from './session';
import { Button, ErrorNote, Facts, Input, Notice, PageHead, Panel } from './ui';

export function AccountSettings() {
  const { me } = useSession();
  const first = useSearchParams().get('first') === '1' || me.mustChangePassword;
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const save = useMutation({
    mutationFn: (v: { current: string; next: string }) => changePassword(v.current, v.next),
    onSuccess: async () => {
      setDone(true);
      await qc.invalidateQueries({ queryKey: ['me'] });
      if (first) router.replace('/app');
    },
  });

  function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next = f.next ?? '';
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) { setError('The new password needs 8 or more characters, with a letter and a number.'); return; }
    if (next !== f.confirm) { setError('The two new passwords are different.'); return; }
    setError(null);
    save.mutate({ current: f.current ?? '', next }, { onSuccess: () => (e.target as HTMLFormElement).reset() });
  }

  return (
    <>
      <PageHead title={first ? 'Choose your own password' : 'Account'} sub={first ? 'You logged in with a temporary password. Choose your own to continue.' : undefined} />
      <div className="grid gap-6 xl:grid-cols-2">
        {!first && (
          <Panel title="Your details">
            <Facts rows={[['Name', me.name], ['Email', me.email], ['Mobile', mobile(me.mobile)], ['Role', me.roleName]]} />
          </Panel>
        )}
        <Panel title="Change password">
          {done && !first && <Notice tone="green">Password changed. Other devices were logged out.</Notice>}
          {error && <p role="alert" className="mb-4 rounded-xl bg-[#fde9eb] px-4 py-3 text-[15px] text-[#b42335]">{error}</p>}
          <ErrorNote error={save.error} />
          <form onSubmit={submit} className="grid gap-4">
            <Input label={first ? 'Temporary password' : 'Current password'} name="current" type="password" autoComplete="current-password" required />
            <Input label="New password" name="next" type="password" autoComplete="new-password" hint="8 or more characters, with a letter and a number" required />
            <Input label="New password again" name="confirm" type="password" autoComplete="new-password" required />
            <div><Button type="submit" busy={save.isPending}>Change password</Button></div>
          </form>
        </Panel>
      </div>
    </>
  );
}
