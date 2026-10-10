import type { Metadata } from 'next';
import { Closing } from '@/components/site/Closing';
import { PageHeader } from '@/components/site/PageHeader';

export const metadata: Metadata = { title: 'About', description: 'Why we build software for insurance advisors in India.' };

const BELIEFS = [
  ['Advisors are the relationship', 'Customers buy from people they trust. The software should give advisors more time with them, not more forms.'],
  ['Renewals are the business', 'A policy sold once and renewed for twenty years is worth far more than a new sale. Nothing should be allowed to lapse by accident.'],
  ['Honest numbers only', 'Premiums, GST and product details are shown as they are. When something is not known, we say “Not available” instead of guessing.'],
  ['Customer data is not ours', 'It belongs to the advisor and their customers. We store it carefully in India and never sell it.'],
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Made for the people who keep families insured" intro="Most advisors still run their business from a diary, a phone gallery and memory. We think they deserve better tools." />
      <section className="bg-paper py-24">
        <div className="mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="headline text-[clamp(2rem,3.6vw,3rem)] text-ink">What we believe</h2>
            <p className="measure mt-5 text-[18px] leading-relaxed text-muted">Insurance Advisor is a software company. We do not sell insurance and we do not compete with the advisors who use us.</p>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {BELIEFS.map(([t, d]) => (
              <div key={t} className="py-6">
                <dt className="font-display text-[21px] font-semibold text-ink">{t}</dt>
                <dd className="measure mt-2 leading-relaxed text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <Closing />
    </>
  );
}
