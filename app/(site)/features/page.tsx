import type { Metadata } from 'next';
import { Capabilities } from '@/components/site/Capabilities';
import { Closing } from '@/components/site/Closing';
import { PageHeader } from '@/components/site/PageHeader';
import { Phone } from '@/components/site/Phone';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Leads, customer files, product comparison, quotations with GST, payment links, renewals, WhatsApp reminders, autodial, AI suggestions and team access.',
};

// Each block shows the real screen it talks about
const BLOCKS = [
  { title: 'Know every lead and every follow-up', text: 'Add a lead in seconds, log each call with its outcome, and convert it into a customer without typing anything twice. Leads from referrals keep the referrer, so credit never gets lost.', screen: '/screens/leads.webp', alt: 'Leads list with status filters' },
  { title: 'One file per customer', text: 'Family members, nominees, needs and KYC documents in one place. Photos and PDFs are checked when uploaded and stay private.', screen: '/screens/customer.webp', alt: 'Customer details with family and documents' },
  { title: 'Quotations customers understand', text: 'Compare plans, add riders, apply a discount (above your limit it waits for approval) and send a PDF. GST is worked out by insurance type, so the total is right the first time.', screen: '/screens/quote.webp', alt: 'Quotation with premium breakdown' },
  { title: 'Renewals that do not slip', text: 'See what is due in 7, 30 or 60 days and what is overdue. Log each call, close a renewal with a reason, or let the reminders go out on their own.', screen: '/screens/renewals.webp', alt: 'Renewals list' },
  { title: 'Suggestions you can explain', text: 'Record the customer’s needs and get the plans that fit, with the reasons taken from the product details. Missing information is shown as a warning, never invented.', screen: '/screens/ai.webp', alt: 'AI product recommendations with reasons' },
  { title: 'Numbers that matter', text: 'Leads to policies, quotations accepted, renewals kept and premium written, for today, this week or this month.', screen: '/screens/reports.webp', alt: 'Reports with conversion funnel' },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHeader title="Everything an advisor needs, nothing they don’t" intro="Built with advisors for the way health, life and motor policies are sold and renewed in India." />
      <section className="bg-paper py-12 sm:py-20">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          {BLOCKS.map((b, i) => (
            <article key={b.title} className={`grid items-center gap-10 border-b border-line py-14 last:border-0 md:grid-cols-2 md:gap-16`}>
              <div className={i % 2 ? 'md:order-2' : ''}>
                <h2 className="headline max-w-[18ch] text-[clamp(1.8rem,3.2vw,2.6rem)] text-ink">{b.title}</h2>
                <p className="measure mt-4 text-[18px] leading-relaxed text-muted">{b.text}</p>
              </div>
              <div className={`mx-auto w-[min(70vw,280px)] [perspective:1200px] ${i % 2 ? 'md:order-1' : ''}`}>
                <div className={i % 2 ? '[transform:rotateY(12deg)]' : '[transform:rotateY(-12deg)]'}>
                  <Phone src={b.screen} alt={b.alt} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Capabilities />
      <Closing />
    </>
  );
}
