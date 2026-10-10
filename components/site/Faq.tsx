const QA = [
  ['Who is this for?', 'Independent insurance advisors and small agencies in India who sell health, life and motor insurance, alone or with office staff.'],
  ['Do my customers need to install anything?', 'No. Only you and your team use the app. Customers receive quotations, payment links and reminders on WhatsApp, SMS or email.'],
  ['How do I get started?', 'Sign up with your mobile number and IRDAI licence number. After a quick check of your details, your 14-day trial starts with every feature.'],
  ['Can I use it on my laptop?', 'Yes. The same account works in the Android app and in any modern browser.'],
  ['How do customers pay?', 'Through a secure Razorpay payment link by UPI, debit or credit card, or net banking. When the payment succeeds, the policy record is created for you.'],
  ['What happens after the trial?', 'Choose Basic or Pro and pay by the same kind of secure link. If you do nothing, your data stays safe and you can pick a plan later.'],
  ['Can I bring my existing policies?', 'Yes. Policies sold before you joined can be added so their renewals are tracked too.'],
];

export function Faq() {
  return (
    <section className="bg-white py-24 sm:py-28" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <h2 id="faq-title" className="headline text-[clamp(2rem,3.8vw,3.2rem)] text-ink">Questions advisors ask</h2>
        <div className="divide-y divide-line border-y border-line">
          {QA.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-[19px] font-semibold text-ink">
                {q}
                <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 ring-line transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="measure mt-3 leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
