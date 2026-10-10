'use client';

// Small set of building blocks for the portal. Light, quiet surfaces; colour only where it means something.
import Link from 'next/link';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { errorText } from '@/lib/portal/client';

export function PageHead({ title, sub, actions, back }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[14px] font-semibold text-blue-deep hover:underline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            {back.label}
          </Link>
        )}
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {sub && <div className="mt-1 text-[15px] text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'quiet';
const btn: Record<BtnVariant, string> = {
  primary: 'bg-blue text-white hover:bg-blue-deep',
  secondary: 'bg-white text-ink ring-1 ring-line hover:ring-blue/40',
  danger: 'bg-white text-[#b42335] ring-1 ring-[#f1c4ca] hover:bg-[#fdf2f3]',
  quiet: 'text-blue-deep hover:bg-mist',
};
export function Button({ variant = 'primary', busy, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; busy?: boolean }) {
  return (
    <button type="button" {...rest} disabled={rest.disabled || busy}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${btn[variant]} ${className}`}>
      {busy && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
export function ButtonLink({ href, variant = 'primary', children }: { href: string; variant?: BtnVariant; children: ReactNode }) {
  return <Link href={href} className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${btn[variant]}`}>{children}</Link>;
}

export function Panel({ title, actions, children, className = '' }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white ring-1 ring-line ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

// Key–value rows for detail pages
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[minmax(120px,40%)_1fr] gap-4 py-2.5 text-[15px]">
          <dt className="text-muted">{k}</dt>
          <dd className="tabular text-right text-ink sm:text-left">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'grey';
const tones: Record<Tone, string> = {
  blue: 'bg-mist text-blue-deep', green: 'bg-[#e4f5ec] text-[#1e7a4f]', amber: 'bg-[#fdf0db] text-[#94590a]',
  red: 'bg-[#fde9eb] text-[#b42335]', grey: 'bg-[#eef1f5] text-muted',
};
export const Badge = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${tones[tone]}`}>{children}</span>
);

// Tables: real <table> for screen readers; rows can link to a detail page
export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
      <table className="w-full border-collapse text-[14.5px]">
        <thead>
          <tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap border-b border-line bg-[#fafbfd] px-4 py-3 text-left text-[13px] font-semibold text-muted">{h}</th>)}</tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-0">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => (
  <td className={`border-b border-line px-4 py-3 align-top text-ink ${className}`}>{children}</td>
);
export const RowLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-semibold text-ink hover:text-blue-deep hover:underline">{children}</Link>
);

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-display text-[18px] font-semibold text-ink">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-[46ch] text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-white ring-1 ring-line" />)}
    </div>
  );
}

export function ErrorNote({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fde9eb] px-4 py-3 text-[15px] text-[#b42335]">
      <span>{errorText(error)}</span>
      {retry && <button type="button" className="font-semibold underline" onClick={retry}>Try again</button>}
    </div>
  );
}

export function Notice({ tone = 'blue', children }: { tone?: 'blue' | 'green' | 'amber'; children: ReactNode }) {
  const c = { blue: 'bg-mist text-blue-deep', green: 'bg-[#e4f5ec] text-[#1e7a4f]', amber: 'bg-[#fdf0db] text-[#7a4a08]' }[tone];
  return <div role="status" className={`mb-4 rounded-xl px-4 py-3 text-[15px] ${c}`}>{children}</div>;
}

// ---------- form fields ----------
const fieldCls = 'mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors focus:border-blue aria-[invalid=true]:border-[#c62f3b] disabled:bg-paper';
function FieldWrap({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold text-ink">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} className="mt-1 text-[13.5px] text-[#b42335]">{error}</p> : hint ? <p className="mt-1 text-[13px] text-muted">{hint}</p> : null}
    </div>
  );
}
type Common = { label: string; hint?: string; error?: string };
export function Input({ label, hint, error, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return <FieldWrap id={id} label={label} hint={hint} error={error}><input id={id} {...rest} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={fieldCls} /></FieldWrap>;
}
export function Select({ label, hint, error, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return <FieldWrap id={id} label={label} hint={hint} error={error}><select id={id} {...rest} aria-invalid={!!error} className={fieldCls}>{children}</select></FieldWrap>;
}
export function Textarea({ label, hint, error, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return <FieldWrap id={id} label={label} hint={hint} error={error}><textarea id={id} rows={3} {...rest} aria-invalid={!!error} className={fieldCls} /></FieldWrap>;
}

// Segmented choice (statuses, ranges, types)
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full bg-white p-1 ring-1 ring-line">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`rounded-full px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors ${value === v ? 'bg-blue text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
      ))}
    </div>
  );
}

// Dialog: focus moves in, Escape closes, focus returns to the button that opened it
export function Dialog({ title, children, footer, onClose, wide }: { title: string; children: ReactNode; footer: ReactNode; onClose: () => void; wide?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); before?.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#13213a]/35 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} className={`max-h-[calc(100vh-2rem)] w-full overflow-auto rounded-2xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(19,33,58,.5)] ${wide ? 'max-w-[760px]' : 'max-w-[520px]'}`}>
        <h2 className="font-display text-[20px] font-semibold text-ink">{title}</h2>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

// Shown where a plan does not include a feature (the server enforces it too)
export function UpgradeNote({ feature }: { feature: string }) {
  return (
    <Panel>
      <Empty title={`${feature} is part of the Pro plan`} text="Your current plan doesn't include it. Upgrade in Subscription to use it."
        action={<ButtonLink href="/app/subscription">See plans</ButtonLink>} />
    </Panel>
  );
}
