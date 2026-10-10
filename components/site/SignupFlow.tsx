'use client';

// Advisor sign-up on the website, using the same API as the mobile app:
//   details → POST /auth/register (sends the OTP) → code → POST /auth/otp/verify → waiting for approval
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { ApiError, errorText } from '@/lib/portal/client';
import { register, registrationStatus, resendOtp, verifyOtp } from '@/lib/portal/api';
import type { OtpChallenge, RegistrationStatus } from '@/lib/portal/types';

type Step = 'details' | 'otp' | 'waiting';
type Field = 'name' | 'email' | 'mobile' | 'password' | 'irdaiNumber' | 'terms';
const SAVED = 'ia.signup'; // lets a refreshed tab continue where it was

const fieldCls = 'mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none transition-colors focus:border-blue aria-[invalid=true]:border-[#c62f3b]';
const labelCls = 'block text-[15px] font-semibold text-ink';

function validate(v: Record<Field, string | boolean>): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (String(v.name).trim().length < 2) e.name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(String(v.email).trim())) e.email = 'Enter a valid email address';
  if (!/^(\+?91)?[6-9]\d{9}$/.test(String(v.mobile).replace(/[\s-]/g, ''))) e.mobile = 'Enter a 10-digit Indian mobile number';
  const pw = String(v.password);
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) e.password = 'At least 8 characters, with a letter and a number';
  if (!v.terms) e.terms = 'Please accept the terms to continue';
  return e;
}

export function SignupFlow() {
  const plan = useSearchParams().get('plan');
  const [step, setStep] = useState<Step>('details');
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field | 'form' | 'code', string>>>({});
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(0);
  const [status, setStatus] = useState<RegistrationStatus>('PENDING_VERIFICATION');
  const heading = useRef<HTMLHeadingElement>(null);

  // Continue after a page refresh (the code screen or the waiting screen)
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SAVED) ?? 'null') as { step: Step; challenge: OtpChallenge } | null;
      // Restored after hydration on purpose: the server-rendered page cannot know what this tab saved
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved?.challenge) { setChallenge(saved.challenge); setStep(saved.step); }
    } catch { /* nothing saved */ }
  }, []);
  useEffect(() => {
    if (challenge && step !== 'details') sessionStorage.setItem(SAVED, JSON.stringify({ step, challenge }));
    heading.current?.focus(); // screen readers hear the new step
  }, [step, challenge]);

  // Resend countdown
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  // While waiting for approval, check every 20 seconds
  useEffect(() => {
    if (step !== 'waiting' || !challenge) return;
    let stop = false;
    const check = async () => {
      try { const s = await registrationStatus(challenge.userId); if (!stop) setStatus(s); } catch { /* try again next time */ }
    };
    void check();
    const t = setInterval(() => void check(), 20_000);
    return () => { stop = true; clearInterval(t); };
  }, [step, challenge]);

  async function submitDetails(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = {
      name: String(f.get('name') ?? ''), email: String(f.get('email') ?? ''), mobile: String(f.get('mobile') ?? ''),
      password: String(f.get('password') ?? ''), irdaiNumber: String(f.get('irdaiNumber') ?? ''), terms: f.get('terms') === 'on',
    };
    const local = validate(v);
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const c = await register({ name: v.name.trim(), email: v.email.trim(), mobile: v.mobile, password: v.password, ...(v.irdaiNumber.trim() ? { irdaiNumber: v.irdaiNumber.trim() } : {}) });
      setChallenge(c);
      setWait(c.resendAfterSec);
      setStep('otp');
    } catch (err) {
      const fields: Partial<Record<Field, string>> = {};
      if (err instanceof ApiError) for (const d of err.details) if (d.path) fields[d.path as Field] = d.message;
      setErrors(Object.keys(fields).length ? fields : { form: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!challenge) return;
    if (!/^\d{6}$/.test(code)) { setErrors({ code: 'Enter the 6-digit code' }); return; }
    setBusy(true);
    setErrors({});
    try {
      await verifyOtp(challenge.challengeId, code);
      setStep('waiting');
    } catch (err) {
      setErrors({ code: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!challenge) return;
    setErrors({});
    try {
      const c = await resendOtp(challenge.challengeId);
      setChallenge(c);
      setWait(c.resendAfterSec);
    } catch (err) {
      setErrors({ code: errorText(err) });
    }
  }

  const err = (k: Field | 'code') => errors[k] ? <p id={`${k}-error`} className="mt-1.5 text-[14px] text-[#b42335]">{errors[k]}</p> : null;
  const aria = (k: Field) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-error` : undefined });
  const card = 'rounded-[28px] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(19,33,58,.35)] ring-1 ring-line sm:p-10';

  if (step === 'otp' && challenge) {
    return (
      <form onSubmit={(e) => void submitCode(e)} noValidate className={card}>
        <h1 ref={heading} tabIndex={-1} className="headline text-[clamp(2rem,4vw,3rem)] text-ink outline-none focus-visible:outline-none">Check your phone</h1>
        <p className="mt-3 text-muted">We sent a 6-digit code to <span className="tabular font-semibold text-ink">{challenge.maskedMobile}</span>. It works for 5 minutes.</p>
        <label className={`${labelCls} mt-8`} htmlFor="code">Verification code</label>
        <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          aria-invalid={!!errors.code} aria-describedby={errors.code ? 'code-error' : undefined}
          className={`${fieldCls} tabular max-w-[240px] text-center text-[26px] tracking-[0.5em]`} />
        {err('code')}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="rounded-full bg-blue px-7 py-3.5 font-semibold text-white transition-colors hover:bg-blue-deep disabled:opacity-60">{busy ? 'Checking…' : 'Verify mobile'}</button>
          <button type="button" disabled={wait > 0} onClick={() => void resend()} className="text-[15px] font-semibold text-blue-deep disabled:text-muted">
            {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
          </button>
        </div>
        <button type="button" className="mt-6 text-[14px] text-muted underline-offset-4 hover:underline" onClick={() => { sessionStorage.removeItem(SAVED); setStep('details'); setCode(''); }}>
          Wrong number? Start again
        </button>
      </form>
    );
  }

  if (step === 'waiting') {
    const approved = status === 'ACTIVE';
    const rejected = status === 'REJECTED';
    return (
      <div className={card} role="status">
        <span aria-hidden="true" className={`grid h-14 w-14 place-items-center rounded-2xl ${approved ? 'bg-[#e4f5ec]' : rejected ? 'bg-[#fde9eb]' : 'bg-mist'}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" stroke={approved ? '#1e8e5a' : rejected ? '#c62f3b' : '#3a75c4'}>
            {approved ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : rejected ? <path d="M7 7l10 10M17 7L7 17" /> : <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>}
          </svg>
        </span>
        <h1 ref={heading} tabIndex={-1} className="headline mt-6 text-[clamp(2rem,4vw,3rem)] text-ink outline-none focus-visible:outline-none">
          {approved ? 'You’re approved' : rejected ? 'We could not approve this account' : 'Mobile verified'}
        </h1>
        <p className="mt-3 max-w-[48ch] leading-relaxed text-muted">
          {approved
            ? 'Your 14-day free trial has started. Log in on the web or in the Android app with your email and password.'
            : rejected
              ? 'Our team could not verify the licence details. Contact us and we will help you sort it out.'
              : 'Our team is checking your details, usually within one working day. You will get an SMS when your account is ready. You can close this page.'}
        </p>
        <div className="mt-8">
          {approved && <a href="/login" className="inline-block rounded-full bg-blue px-7 py-3.5 font-semibold text-white hover:bg-blue-deep">Log in</a>}
          {rejected && <a href="/contact" className="inline-block rounded-full bg-blue px-7 py-3.5 font-semibold text-white hover:bg-blue-deep">Contact us</a>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submitDetails(e)} noValidate className={card}
      // Typing in a field clears its old error
      onChange={(e) => { const t = e.target as EventTarget; const n = (t instanceof HTMLInputElement ? t.name : '') as Field; if (errors[n] || errors.form) setErrors({ ...errors, [n]: undefined, form: undefined }); }}>
      <h1 ref={heading} tabIndex={-1} className="headline text-[clamp(2rem,4vw,3rem)] text-ink outline-none focus-visible:outline-none">Start your free trial</h1>
      <p className="mt-3 text-muted">
        {plan === 'basic' || plan === 'pro'
          ? `Every account starts with 14 days of everything. You can switch to ${plan === 'pro' ? 'Pro' : 'Basic'} at any time from Subscription.`
          : '14 days with every feature. No card needed.'}
      </p>
      {errors.form && <p role="alert" className="mt-6 rounded-xl bg-[#fde9eb] px-4 py-3 text-[#b42335]">{errors.form}</p>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="name">Full name</label>
          <input id="name" name="name" autoComplete="name" className={fieldCls} {...aria('name')} />
          {err('name')}
        </div>
        <div>
          <label className={labelCls} htmlFor="mobile">Mobile number</label>
          <input id="mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" className={fieldCls} {...aria('mobile')} />
          {err('mobile')}
        </div>
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className={fieldCls} {...aria('email')} />
          {err('email')}
        </div>
        <div>
          <label className={labelCls} htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" className={fieldCls} {...aria('password')} />
          {err('password') ?? <p className="mt-1.5 text-[13px] text-muted">8 or more characters, with a letter and a number</p>}
        </div>
        <div>
          <label className={labelCls} htmlFor="irdaiNumber">IRDAI licence number <span className="font-normal text-muted">(if you have it)</span></label>
          <input id="irdaiNumber" name="irdaiNumber" autoComplete="off" maxLength={30} className={fieldCls} {...aria('irdaiNumber')} />
          {err('irdaiNumber')}
        </div>
      </div>
      <label className="mt-6 flex items-start gap-3 text-[15px] text-muted">
        <input type="checkbox" name="terms" className="mt-1 h-4 w-4 accent-[#3a75c4]" {...aria('terms')} />
        <span>I agree to the <a className="text-blue-deep underline" href="/legal/terms" target="_blank">terms of use</a> and the <a className="text-blue-deep underline" href="/legal/privacy" target="_blank">privacy policy</a>.</span>
      </label>
      {err('terms')}
      <button type="submit" disabled={busy} className="mt-8 w-full rounded-full bg-blue px-7 py-3.5 font-semibold text-white shadow-[0_12px_30px_-12px_rgba(58,117,196,.75)] transition-colors hover:bg-blue-deep disabled:opacity-60 sm:w-auto">
        {busy ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
