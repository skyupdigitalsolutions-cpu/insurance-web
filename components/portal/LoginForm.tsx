'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { login } from '@/lib/portal/api';
import { errorText } from '@/lib/portal/client';

const field = 'mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none focus:border-blue';

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const identifier = String(f.get('identifier') ?? '').trim();
    const password = String(f.get('password') ?? '');
    if (!identifier || !password) { setError('Enter your email or mobile number and your password.'); return; }
    setBusy(true);
    setError(null);
    try {
      const r = await login(identifier, password, f.get('remember') === 'on');
      // Only go back to a page inside the workspace
      const target = next && next.startsWith('/app') ? next : '/app';
      router.replace(r.mustChangePassword ? '/app/settings?first=1' : target);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="mt-8 space-y-5">
      {error && <p role="alert" className="rounded-xl bg-[#fde9eb] px-4 py-3 text-[15px] text-[#b42335]">{error}</p>}
      <div>
        <label htmlFor="identifier" className="block text-[15px] font-semibold text-ink">Email or mobile number</label>
        <input id="identifier" name="identifier" autoComplete="username" className={field} autoFocus />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="block text-[15px] font-semibold text-ink">Password</label>
          <button type="button" onClick={() => setShow(!show)} className="text-[13.5px] font-semibold text-blue-deep">{show ? 'Hide' : 'Show'}</button>
        </div>
        <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" className={field} />
      </div>
      <label className="flex items-center gap-3 text-[15px] text-muted">
        <input type="checkbox" name="remember" className="h-4 w-4 accent-[#3a75c4]" />
        Keep me logged in on this computer
      </label>
      <button type="submit" disabled={busy} className="w-full rounded-full bg-blue px-6 py-3.5 font-semibold text-white shadow-[0_12px_30px_-12px_rgba(58,117,196,.75)] hover:bg-blue-deep disabled:opacity-60">
        {busy ? 'Logging in…' : 'Log in'}
      </button>
      <p className="text-[14px] text-muted">Forgot your password? <a className="font-semibold text-blue-deep hover:underline" href="/contact">Contact us</a> and we will reset it.</p>
    </form>
  );
}
