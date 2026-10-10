import type { ReactNode } from 'react';

// Light band at the top of inner pages, with the renewal ring drawn faintly on the right
export function PageHeader({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-paper pb-20 pt-36 text-ink sm:pt-40">
      <svg aria-hidden="true" viewBox="0 0 600 600" className="absolute -right-32 -top-10 hidden h-[560px] w-[560px] opacity-50 sm:block">
        <circle cx="300" cy="300" r="250" fill="none" stroke="#a9c8f0" strokeWidth="1.2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={300 + Math.cos(a) * 250} cy={300 + Math.sin(a) * 250} r={i === 2 ? 11 : 4.5} fill={i === 2 ? '#f2a93b' : '#a9c8f0'} />;
        })}
      </svg>
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <h1 className="headline max-w-[18ch] text-[clamp(2.6rem,6vw,4.6rem)]">{title}</h1>
        {intro && <p className="mt-5 max-w-[56ch] text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-muted">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
