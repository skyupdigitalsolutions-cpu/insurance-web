import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignupFlow } from '@/components/site/SignupFlow';

export const metadata: Metadata = {
  title: 'Start your free trial',
  description: 'Create your Insurance Advisor account: verify your mobile, get approved, and use every feature free for 14 days.',
};

export default function SignupPage() {
  return (
    <section className="relative overflow-hidden bg-paper pb-24 pt-32 sm:pt-36">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(58,117,196,.16),transparent_65%)]" />
      <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        {/* useSearchParams (chosen plan) needs a Suspense boundary for static rendering */}
        <Suspense fallback={<div className="h-[560px] rounded-[28px] bg-white ring-1 ring-line" />}>
          <SignupFlow />
        </Suspense>
        <aside className="lg:pt-6">
          <h2 className="font-display text-[22px] font-semibold text-ink">What happens next</h2>
          {/* A real sequence, so it is numbered */}
          <ol className="mt-6 space-y-6">
            {[
              ['Verify your mobile', 'We send a 6-digit code by SMS. It confirms the number your customers will see.'],
              ['We check your licence', 'Our team checks your IRDAI details, usually within one working day. You get an SMS when you are approved.'],
              ['Use everything for 14 days', 'Leads, quotations, payment links, renewals, AI and Autodial. No card needed. Choose a plan when you are ready.'],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[36px_1fr] gap-3">
                <span className="tabular grid h-9 w-9 place-items-center rounded-full bg-white font-display font-semibold text-blue ring-1 ring-line">{i + 1}</span>
                <span>
                  <span className="block font-semibold text-ink">{t}</span>
                  <span className="mt-1 block leading-relaxed text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-[15px] text-muted">Already have an account? <a className="font-semibold text-blue-deep underline-offset-4 hover:underline" href="/login">Log in</a></p>
        </aside>
      </div>
    </section>
  );
}
