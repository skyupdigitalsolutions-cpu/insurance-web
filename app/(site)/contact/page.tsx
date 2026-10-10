import type { Metadata } from 'next';
import { ContactForm } from '@/components/site/ContactForm';
import { PageHeader } from '@/components/site/PageHeader';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Contact', description: 'Talk to the Insurance Advisor team about the platform, pricing or moving your existing customers.' };

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Talk to us" intro="Questions about the platform, pricing or bringing your existing customers across? Leave your number and we will call you." />
      <section className="bg-paper py-20">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[1.3fr_0.7fr]">
          <ContactForm />
          <aside className="space-y-8">
            <div>
              <h2 className="font-display text-[19px] font-semibold text-ink">Email</h2>
              <a href={`mailto:${SITE.email}`} className="mt-1 block text-blue hover:underline">{SITE.email}</a>
            </div>
            <div>
              <h2 className="font-display text-[19px] font-semibold text-ink">Phone</h2>
              <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="tabular mt-1 block text-blue hover:underline">{SITE.phone}</a>
              <p className="mt-1 text-muted">Monday to Saturday, 9:30 am to 6:30 pm</p>
            </div>
            <div>
              <h2 className="font-display text-[19px] font-semibold text-ink">Office</h2>
              <p className="mt-1 text-muted">{SITE.address}</p>
            </div>
            <div>
              <h2 className="font-display text-[19px] font-semibold text-ink">Already using the app?</h2>
              <p className="mt-1 text-muted">Email us from the address you registered with, so we can find your account quickly.</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
