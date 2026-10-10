'use client';

import { useEffect, useState } from 'react';
import { FALLBACK_PLANS, FEATURE_NAMES, GST_RATE, fetchPlans, rupees, type Plan } from '@/lib/plans';
import { ButtonLink } from './Button';

// Prices are read from the backend, so the website and the app always agree
export function Pricing({ heading = true }: { heading?: boolean }) {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [yearly, setYearly] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchPlans(ctrl.signal).then(setPlans);
    return () => ctrl.abort();
  }, []);

  const allFeatures = Object.keys(FEATURE_NAMES);
  return (
    <section id="pricing" className="bg-paper py-24 sm:py-28" aria-labelledby={heading ? 'pricing-title' : undefined}>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          {heading ? (
            <div>
              <h2 id="pricing-title" className="headline text-[clamp(2rem,4vw,3.4rem)] text-ink">Simple pricing</h2>
              <p className="mt-3 text-[18px] text-muted">Start free for 14 days. Pick a plan when you are ready.</p>
            </div>
          ) : <span />}
          <div className="flex rounded-full bg-white p-1 ring-1 ring-line" role="group" aria-label="Billing period">
            {[false, true].map((y) => (
              <button key={String(y)} type="button" aria-pressed={yearly === y} onClick={() => setYearly(y)}
                className={`rounded-full px-5 py-2 text-[15px] font-semibold transition-colors ${yearly === y ? 'bg-blue text-white' : 'text-muted hover:text-ink'}`}>
                {y ? 'Yearly (2 months free)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((p) => {
            const price = yearly ? p.yearly : p.monthly;
            const pro = p.popular === true;
            return (
              <article key={p.id} className={`relative flex flex-col rounded-[28px] p-8 ${pro ? 'bg-white ring-2 ring-blue shadow-[0_40px_80px_-30px_rgba(36,82,143,.45)] lg:-my-4 lg:py-12' : 'bg-white ring-1 ring-line'}`}>
                {pro && <span className="absolute right-6 top-6 rounded-full bg-marigold px-3 py-1 text-[13px] font-semibold text-ink">Everything included</span>}
                <h3 className="font-display text-[24px] font-semibold">{p.name}</h3>
                <p className="mt-1 text-muted">{p.tagline}</p>
                <p className="mt-7 flex items-baseline gap-2">
                  <span className="tabular font-display text-[48px] font-semibold leading-none tracking-tight">{price === 0 ? '₹0' : rupees(price)}</span>
                  <span className="text-muted">{price === 0 ? 'for 14 days' : yearly ? 'per year' : 'per month'}</span>
                </p>
                <p className="tabular mt-2 text-[14px] text-muted">
                  {price === 0 ? 'No card needed' : `+ 18% GST (${rupees(Math.round(price * GST_RATE))}), ${p.users === 1 ? '1 user' : `up to ${p.users} users`}`}
                </p>
                <ul className="mt-7 flex-1 space-y-3 text-[15px]">
                  {allFeatures.map((f) => {
                    const has = p.features.includes(f);
                    return (
                      <li key={f} className={`flex gap-3 ${has ? '' : 'text-[#a3afc0]'}`}>
                        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 shrink-0">
                          {has ? <path d="M5 10.5l3.2 3.2L15 6.8" fill="none" stroke="#3a75c4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            : <path d="M6 10h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
                        </svg>
                        <span>{FEATURE_NAMES[f]}<span className="sr-only">{has ? ' (included)' : ' (not included)'}</span></span>
                      </li>
                    );
                  })}
                </ul>
                <ButtonLink href={`/signup${p.id === 'trial' ? '' : `?plan=${p.id}`}`} variant={pro ? 'primary' : 'secondary'} className="mt-9 w-full">
                  {p.id === 'trial' ? 'Start free trial' : `Start with ${p.name}`}
                </ButtonLink>
              </article>
            );
          })}
        </div>
        <p className="mt-10 text-[14px] text-muted">Every account starts with the 14-day trial. Paid plans keep working for 3 days after the renewal date while payment is sorted out.</p>
      </div>
    </section>
  );
}
