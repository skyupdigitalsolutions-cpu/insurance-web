// How customer data is handled. Every point describes something the platform actually does.
const POINTS = [
  ['Stored in India', 'Business data and documents are kept in Mumbai data centres.'],
  ['Private documents', 'KYC files are never public. They open through links that stop working after 15 minutes.'],
  ['Consent first', 'Automatic WhatsApp messages go only to customers who agreed to receive them.'],
  ['Separate accounts', 'Each advisor’s customers are visible only to that advisor and their team.'],
  ['Everything recorded', 'Approvals, discounts, payments and logins are kept in an audit log.'],
];

export function Trust() {
  return (
    <section className="relative overflow-hidden bg-mist py-24 text-ink sm:py-28" aria-labelledby="trust-title">
      <div aria-hidden="true" className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.9),transparent_65%)]" />
      <div className="relative mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 id="trust-title" className="headline max-w-[13ch] text-[clamp(2rem,4vw,3.4rem)]">Your customers trust you. We keep it that way.</h2>
          <p className="measure mt-5 text-[18px] leading-relaxed text-muted">Advisors hold family details, health needs and identity documents. The platform is built so that information stays safe.</p>
        </div>
        <ul className="divide-y divide-[#cddbee] border-y border-[#cddbee]">
          {POINTS.map(([t, d]) => (
            <li key={t} className="grid gap-1 py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
              <span className="font-display text-[19px] font-semibold">{t}</span>
              <span className="leading-relaxed text-muted">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
