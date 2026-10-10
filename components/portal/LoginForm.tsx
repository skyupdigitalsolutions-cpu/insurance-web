'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { login } from '@/lib/portal/api';
import { errorText } from '@/lib/portal/client';

const field = 'mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none focus:border-blue';

// ── Password strength ──────────────────────────────────────────────────────
type Strength = { score: 0 | 1 | 2 | 3; label: string; color: string };

function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '', color: '' };
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasDigit  = /\d/.test(pw);
  const hasUpper  = /[A-Z]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const long = pw.length >= 12;

  const points = [pw.length >= 8, hasLetter && hasDigit, hasUpper, hasSpecial, long].filter(Boolean).length;

  if (points <= 2) return { score: 1, label: 'Weak',   color: 'bg-red-500' };
  if (points === 3) return { score: 2, label: 'Fair',   color: 'bg-amber-400' };
  return              { score: 3, label: 'Strong', color: 'bg-green-500' };
}

function StrengthBar({ password }: { password: string }) {
  const s = passwordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {([1, 2, 3] as const).map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s.score >= i ? s.color : 'bg-line'}`} />
        ))}
      </div>
      <p className={`mt-1 text-[12px] font-semibold ${s.score === 1 ? 'text-red-500' : s.score === 2 ? 'text-amber-500' : 'text-green-600'}`}>
        {s.label}
        {s.score < 3 && (
          <span className="ml-1 font-normal text-muted">
            {s.score === 1 && '— add numbers, uppercase or symbols'}
            {s.score === 2 && '— add uppercase or symbols to strengthen'}
          </span>
        )}
      </p>
    </div>
  );
}

// ── Password rules hint ────────────────────────────────────────────────────
function PasswordRules({ password }: { password: string }) {
  const rules = [
    { ok: password.length >= 8,      text: 'At least 8 characters' },
    { ok: /[A-Za-z]/.test(password), text: 'Contains a letter' },
    { ok: /\d/.test(password),       text: 'Contains a number' },
  ];
  return (
    <ul className="mt-2 space-y-0.5">
      {rules.map((r) => (
        <li key={r.text} className={`flex items-center gap-1.5 text-[12px] ${r.ok ? 'text-green-600' : 'text-muted'}`}>
          <span>{r.ok ? '✓' : '○'}</span>
          {r.text}
        </li>
      ))}
    </ul>
  );
}

// ── Forgot-password inline form ────────────────────────────────────────────
function ForgotPasswordForm({ onClose }: { onClose: () => void }) {
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!identifier.trim()) { setError('Enter your email or mobile number.'); return; }
    setBusy(true);
    setError(null);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      // Always show success — never reveal if account exists
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-4">
        <p className="font-semibold text-green-800 text-[15px]">✓ Password reset</p>
        <p className="mt-1 text-[13.5px] text-green-700">
          A temporary password has been sent to your registered mobile or email.
          Check Terminal 1 for the new password (demo mode).
          You will be asked to change it on first login.
        </p>
        <button type="button" onClick={onClose} className="mt-3 text-[13.5px] font-semibold text-blue-deep hover:underline">
          Back to login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="mt-4 rounded-xl bg-[#f4f6fb] border border-line px-4 py-4 space-y-3">
      <p className="font-semibold text-[15px] text-ink">Reset your password</p>
      <p className="text-[13.5px] text-muted">Enter your registered email or mobile number. A temporary password will be generated for you.</p>
      {error && <p className="text-[13.5px] text-[#b42335]">{error}</p>}
      <input
        type="text"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Email or mobile number"
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:border-blue"
        autoFocus
      />
      <div className="flex gap-2">
        <button type="submit" disabled={busy}
          className="rounded-full bg-blue px-5 py-2 text-[14px] font-semibold text-white hover:bg-blue-deep disabled:opacity-60">
          {busy ? 'Sending…' : 'Send new password'}
        </button>
        <button type="button" onClick={onClose}
          className="rounded-full px-5 py-2 text-[14px] font-semibold text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main login form ────────────────────────────────────────────────────────
export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [showRules, setShowRules] = useState(false);

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const identifier = String(f.get('identifier') ?? '').trim();
    const password   = String(f.get('password') ?? '');
    if (!identifier || !password) { setError('Enter your email or mobile number and your password.'); return; }
    setBusy(true);
    setError(null);
    try {
      const r = await login(identifier, password, f.get('remember') === 'on');
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
          <button type="button" onClick={() => setShow(!show)} className="text-[13.5px] font-semibold text-blue-deep">
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setShowRules(true)}
          onBlur={() => setShowRules(false)}
        />
        {/* Password strength bar */}
        <StrengthBar password={password} />
        {/* Password rules — shown while focused */}
        {showRules && <PasswordRules password={password} />}
      </div>

      <label className="flex items-center gap-3 text-[15px] text-muted">
        <input type="checkbox" name="remember" className="h-4 w-4 accent-[#3a75c4]" />
        Keep me logged in on this computer
      </label>

      <button type="submit" disabled={busy}
        className="w-full rounded-full bg-blue px-6 py-3.5 font-semibold text-white shadow-[0_12px_30px_-12px_rgba(58,117,196,.75)] hover:bg-blue-deep disabled:opacity-60">
        {busy ? 'Logging in…' : 'Log in'}
      </button>

      {/* Forgot password */}
      <p className="text-[14px] text-muted">
        Forgot your password?{' '}
        <button type="button" onClick={() => setShowForgot(!showForgot)} className="font-semibold text-blue-deep hover:underline">
          Reset it here
        </button>
      </p>

      {showForgot && <ForgotPasswordForm onClose={() => setShowForgot(false)} />}
    </form>
  );
}
