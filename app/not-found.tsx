import Link from 'next/link';
import { LogoMark } from '@/components/site/Logo';

export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-paper px-5 text-center text-ink">
      <div>
        <div className="mx-auto w-fit"><LogoMark size={48} /></div>
        <h1 className="headline mt-6 text-[clamp(2.4rem,6vw,4rem)]">This page does not exist</h1>
        <p className="mt-4 text-muted">The link may be old or mistyped.</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-blue px-6 py-3.5 font-semibold text-white">Go to the home page</Link>
      </div>
    </main>
  );
}
