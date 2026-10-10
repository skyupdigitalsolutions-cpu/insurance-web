import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/portal/LoginForm';
import { Logo } from '@/components/site/Logo';
import { ShieldFallback } from '@/components/three/ShieldScene';

export const metadata: Metadata = { title: 'Log in', description: 'Log in to your Insurance Advisor workspace.' };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[1fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-mist p-12 lg:flex lg:flex-col">
        <Logo tone="dark" />
        <div className="my-auto">
          <div className="h-[300px]"><ShieldFallback /></div>
          <p className="mx-auto mt-8 max-w-[34ch] text-center font-display text-[24px] font-semibold leading-snug text-ink">Your renewals, quotations and customers, right where you left them.</p>
        </div>
        <p className="text-[14px] text-muted">The same account works in the Android app.</p>
      </section>
      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden"><Logo tone="dark" /></div>
        <div className="mx-auto my-auto w-full max-w-[420px] py-10">
          <h1 className="headline text-[clamp(2.2rem,4vw,3rem)] text-ink">Log in</h1>
          <p className="mt-2 text-muted">For advisors and their office staff.</p>
          {/* useSearchParams (where to go after login) needs a Suspense boundary */}
          <Suspense fallback={<div className="mt-8 h-[320px]" />}><LoginForm /></Suspense>
          <p className="mt-8 text-[15px] text-muted">New to Insurance Advisor? <Link href="/signup" className="font-semibold text-blue-deep hover:underline">Start your free trial</Link></p>
        </div>
        <p className="text-center text-[13px] text-muted"><Link href="/" className="hover:underline">Back to the website</Link></p>
      </section>
    </div>
  );
}
