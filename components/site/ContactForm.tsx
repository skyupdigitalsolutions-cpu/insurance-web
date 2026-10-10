'use client';

import { useState, type SyntheticEvent } from 'react';
import { API_URL } from '@/lib/site';

type Errors = Partial<Record<'name' | 'mobile' | 'email' | 'message' | 'consent' | 'form', string>>;

// Sends to POST /public/enquiries. The hidden "website" field catches bots.
export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      name: String(f.get('name') ?? ''), mobile: String(f.get('mobile') ?? ''), email: String(f.get('email') ?? ''),
      city: String(f.get('city') ?? ''), message: String(f.get('message') ?? ''), consent: f.get('consent') === 'on', website: String(f.get('website') ?? ''),
    };
    const local: Errors = {};
    if (body.name.trim().length < 2) local.name = 'Enter your name';
    if (!/^(\+?91)?[6-9]\d{9}$/.test(body.mobile.replace(/[\s-]/g, ''))) local.mobile = 'Enter a 10-digit Indian mobile number';
    if (body.message.trim().length < 10) local.message = 'Tell us a little more (at least 10 characters)';
    if (!body.consent) local.consent = 'Please agree so we can contact you';
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/public/enquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setSent(true); return; }
      const err = (await res.json().catch(() => null)) as { message?: string; details?: { path?: string; message?: string }[] } | null;
      const fieldErrors: Errors = {};
      for (const d of err?.details ?? []) if (d.path) fieldErrors[d.path as keyof Errors] = d.message;
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { form: err?.message ?? 'Could not send your message. Try again.' });
    } catch {
      setErrors({ form: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[28px] bg-white p-8 ring-1 ring-line" role="status">
        <h2 className="font-display text-[26px] font-semibold text-ink">Message sent</h2>
        <p className="mt-3 leading-relaxed text-muted">Thank you. Someone from our team will call you within one working day.</p>
      </div>
    );
  }

  const field = 'mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none transition-colors focus:border-blue';
  const label = 'block text-[15px] font-semibold text-ink';
  const err = (k: keyof Errors) => errors[k] ? <p id={`${k}-error`} className="mt-1.5 text-[14px] text-[#b42335]">{errors[k]}</p> : null;

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="rounded-[28px] bg-white p-6 ring-1 ring-line sm:p-8">
      {errors.form && <p role="alert" className="mb-5 rounded-xl bg-[#fde9eb] px-4 py-3 text-[#b42335]">{errors.form}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>Your name
          <input name="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
          {err('name')}
        </label>
        <label className={label}>Mobile number
          <input name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="98450 12345" className={field} aria-invalid={!!errors.mobile} aria-describedby={errors.mobile ? 'mobile-error' : undefined} />
          {err('mobile')}
        </label>
        <label className={label}>Email <span className="font-normal text-muted">(optional)</span>
          <input name="email" type="email" autoComplete="email" className={field} />
          {err('email')}
        </label>
        <label className={label}>City <span className="font-normal text-muted">(optional)</span>
          <input name="city" autoComplete="address-level2" className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>How can we help?
          <textarea name="message" rows={5} className={field} placeholder="For example: I have about 300 customers and two office staff." aria-invalid={!!errors.message} aria-describedby={errors.message ? 'message-error' : undefined} />
          {err('message')}
        </label>
        {/* Hidden from people; bots fill it in */}
        <div aria-hidden="true" className="absolute left-[-9999px]">
          <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
      </div>
      <label className="mt-5 flex gap-3 text-[15px] text-muted">
        <input name="consent" type="checkbox" className="mt-1 h-4 w-4 accent-[#3a75c4]" />
        <span>I agree to be contacted by phone, WhatsApp or email about Insurance Advisor.</span>
      </label>
      {err('consent')}
      <button type="submit" disabled={busy} className="mt-7 w-full rounded-full bg-blue px-6 py-3.5 font-semibold text-white transition-colors hover:bg-blue-deep disabled:opacity-60 sm:w-auto">
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
