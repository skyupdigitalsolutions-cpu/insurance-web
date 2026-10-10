'use client';

import dynamic from 'next/dynamic';
import { ShieldFallback } from '@/components/three/ShieldScene';
import { ButtonLink } from './Button';

// The 3D scene is loaded after the text, so the headline appears immediately
const ShieldScene = dynamic(() => import('@/components/three/ShieldScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full opacity-40"><ShieldFallback /></div>,
});

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-paper">
      {/* soft daylight behind the shield and a faint grid, like graph paper in a policy file */}
      <div aria-hidden="true" className="pointer-events-none absolute right-[-12%] top-[6%] h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle,rgba(58,117,196,.20),rgba(169,200,240,.12)_45%,transparent_68%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(58,117,196,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(58,117,196,.06)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
      <div className="relative mx-auto grid min-h-[100svh] max-w-[1240px] items-center gap-6 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div className="relative z-10">
          <h1 className="headline text-[clamp(2.8rem,7vw,5.6rem)] text-ink">Every policy you sell, renewed on time.</h1>
          <p className="mt-6 max-w-[46ch] text-[clamp(1.05rem,1.6vw,1.25rem)] leading-relaxed text-muted">
            Leads, quotations, payments and renewals in one place, built for insurance advisors in India. On your phone and on the web.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/signup">Start your 14-day free trial</ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary">See how it works</ButtonLink>
          </div>
          <p className="mt-5 text-[14px] text-muted">No card needed. Health, life and motor.</p>
        </div>

        <div className="relative h-[420px] sm:h-[520px] lg:h-[640px]">
          {/* soft shadow under the floating shield */}
          <div aria-hidden="true" className="absolute bottom-[12%] left-1/2 h-10 w-[46%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(36,82,143,.22),transparent)] blur-md" />
          <ShieldScene className="absolute inset-0" />
          {/* A real reminder, as advisors see it in the app */}
          <div className="absolute bottom-6 left-0 hidden rounded-2xl bg-white/90 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(19,33,58,.35)] ring-1 ring-line backdrop-blur-md sm:block lg:bottom-20 lg:left-[-4%]">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-marigold shadow-[0_0_12px_#f2a93b]" aria-hidden="true" />
              <div>
                <p className="text-[14px] font-semibold text-ink">Renewal due in 7 days</p>
                <p className="tabular text-[13px] text-muted">Ravi Kumar, Family Health Optima, ₹21,650</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
