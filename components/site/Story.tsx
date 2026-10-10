'use client';

import { useScroll } from 'motion/react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

const StoryScene = dynamic(() => import('@/components/three/StoryScene'), { ssr: false });

// The five steps really are a sequence, so they are numbered
const STEPS = [
  { title: 'Lead', text: 'Ravi calls about health cover for his family. Add him as a lead in seconds, with where he came from and when to call back.' },
  { title: 'Quotation', text: 'Compare plans side by side and send a quotation with GST already worked out: 0% for health and life, 18% for motor.' },
  { title: 'Payment', text: 'Share a secure payment link on WhatsApp. Ravi pays by UPI, card or net banking, and the policy is created the moment the money arrives.' },
  { title: 'Policy', text: 'Nominees, family members and KYC documents stay with the policy, not in a diary or a phone gallery.' },
  { title: 'Renewal', text: 'Thirty, seven and one day before the due date, Ravi gets a reminder, or you get a call task. Nothing slips through.' },
];

export function Story() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const [step, setStep] = useState(0);

  return (
    <section id="how-it-works" ref={section} className="relative bg-white text-ink" style={{ height: `${STEPS.length * 85}vh` }} aria-labelledby="story-title">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="mx-auto grid h-full w-full max-w-[1240px] items-center gap-4 px-5 pt-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="relative z-10 order-2 lg:order-1">
            <h2 id="story-title" className="headline text-[clamp(2rem,4.2vw,3.4rem)]">From first call to renewal</h2>
            <p className="mt-3 max-w-[40ch] text-muted">One customer, the whole way through. Scroll to follow Ravi.</p>
            <p className="mt-2 text-[14px] text-muted lg:hidden" aria-hidden="true">Step {step + 1} of {STEPS.length}</p>
            <ol className="mt-6 space-y-1 lg:mt-8">
              {STEPS.map((s, i) => (
                <li key={s.title} aria-current={i === step ? 'step' : undefined}
                  className={`rounded-2xl px-4 py-3 transition-colors duration-500 ${i === step ? 'bg-paper ring-1 ring-line' : 'hidden lg:block'}`}>
                  <div className="flex items-baseline gap-3">
                    <span className={`tabular font-display text-[15px] ${i === step ? 'text-blue' : 'text-[#9aa8bd]'}`}>{i + 1}</span>
                    <span className={`font-display text-[20px] font-semibold transition-colors ${i === step ? 'text-ink' : 'text-[#8796ad]'}`}>{s.title}</span>
                  </div>
                  <p className={`ml-7 overflow-hidden text-[15px] leading-relaxed text-muted transition-all duration-500 ${i === step ? 'mt-1.5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="order-1 h-[42svh] lg:order-2 lg:h-[78svh]">
            <StoryScene progress={scrollYProgress} onStep={setStep} />
          </div>
        </div>
      </div>
    </section>
  );
}
