// Everything included, as a plain list: what it is, in one line
const ITEMS = [
  ['Leads and follow-ups', 'Source, need and next call for every enquiry, with a history of each contact.'],
  ['Customer files', 'Family members, nominees and KYC documents checked for file type and kept private.'],
  ['Product comparison', 'Two or three plans side by side. Missing details show as “Not available”, never guessed.'],
  ['Quotations', 'Discounts with approval, correct GST by insurance type, and a PDF to share.'],
  ['Payment links', 'Razorpay links by UPI, card or net banking. Paid links create the policy automatically.'],
  ['Renewals', 'Due in 7, 30 or 60 days, overdue, contacted or closed with a reason.'],
  ['WhatsApp and email', 'Approved templates filled with the customer’s details, sent only with consent.'],
  ['Autodial', 'Call lists for new leads, open leads and renewals, with the outcome saved after each call.'],
  ['AI suggestions', 'Plans that fit the customer’s needs, explained only from the product data you have.'],
  ['Team access', 'Add office staff with roles, so each person sees and does only what they should.'],
  ['Reports', 'Conversion from lead to policy, renewals kept and premium written, by period.'],
  ['Audit trail', 'Logins, approvals, discounts and payments are recorded with who and when.'],
];

export function Capabilities() {
  return (
    <section className="bg-white py-24 sm:py-28" aria-labelledby="cap-title">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 id="cap-title" className="headline max-w-[14ch] text-[clamp(2rem,3.8vw,3.2rem)] text-ink">Everything in one app</h2>
          <p className="measure self-end text-[18px] leading-relaxed text-muted">The same account works in the Android app and in the browser. What you add on the phone is on your laptop a moment later.</p>
        </div>
        <dl className="mt-14 grid gap-x-12 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(([t, d]) => (
            <div key={t} className="border-b border-line py-6">
              <dt className="font-display text-[19px] font-semibold text-ink">{t}</dt>
              <dd className="mt-1.5 leading-relaxed text-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
