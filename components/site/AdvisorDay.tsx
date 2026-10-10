'use client';

import { useState } from 'react';
import { Phone } from './Phone';

// Features told as an advisor's working day. Times are a real sequence, so they lead each row.
const DAY = [
  { time: '9:00', title: 'See who is due today', text: 'The dashboard opens on renewals due, overdue payments and the calls you planned. Tap one to act on it.', screen: '/screens/dashboard.webp', alt: 'Dashboard with renewals due and pending actions' },
  { time: '11:30', title: 'Meet Ravi, compare plans', text: 'Pick the products, compare cover and premium side by side, and send a quotation as a PDF before you leave.', screen: '/screens/quote.webp', alt: 'Approved quotation with premium and GST' },
  { time: '15:00', title: 'Payment arrives', text: 'Ravi pays from the link you sent on WhatsApp. The payment, the policy and his file update on their own.', screen: '/screens/payment.webp', alt: 'Quotation marked paid' },
  { time: '17:30', title: 'Plan tomorrow', text: 'Your renewals list shows who to call next. Your office staff see the same list, with only the access you give them.', screen: '/screens/renewals.webp', alt: 'Renewals list with upcoming, contacted and closed renewals' },
];

export function AdvisorDay() {
  const [active, setActive] = useState(0);
  const item = DAY[active] ?? DAY[0]!;
  return (
    <section className="overflow-hidden bg-paper py-24 sm:py-32" aria-labelledby="day-title">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 id="day-title" className="headline max-w-[16ch] text-[clamp(2.2rem,4.6vw,3.8rem)] text-ink">Built around an advisor’s day</h2>
          <p className="measure mt-5 text-[18px] leading-relaxed text-muted">Not a generic CRM with insurance words added. Every screen follows the way policies are actually sold and renewed.</p>
          <ol className="mt-10 border-t border-line">
            {DAY.map((d, i) => (
              <li key={d.time} className="border-b border-line">
                <button type="button" onClick={() => setActive(i)} onMouseEnter={() => setActive(i)} aria-pressed={i === active}
                  className="grid w-full grid-cols-[72px_1fr] gap-4 py-5 text-left">
                  <span className={`tabular font-display text-[22px] font-semibold transition-colors ${i === active ? 'text-blue' : 'text-[#9aa8bd]'}`}>{d.time}</span>
                  <span>
                    <span className={`block font-display text-[21px] font-semibold ${i === active ? 'text-ink' : 'text-[#43526b]'}`}>{d.title}</span>
                    <span className={`block overflow-hidden leading-relaxed text-muted transition-all duration-500 ${i === active ? 'mt-1.5 max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>{d.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative mx-auto w-[min(78vw,330px)] [perspective:1400px]">
          <div aria-hidden="true" className="absolute inset-x-[-30%] top-[12%] h-[70%] rounded-full bg-[radial-gradient(circle,rgba(58,117,196,.22),transparent_65%)]" />
          <div className="transition-transform duration-700 [transform:rotateY(-14deg)_rotateX(6deg)] hover:[transform:rotateY(-4deg)_rotateX(2deg)]">
            <Phone key={item.screen} src={item.screen} alt={item.alt} />
          </div>
        </div>
      </div>
    </section>
  );
}
