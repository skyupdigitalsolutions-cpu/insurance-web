import type { Metadata } from 'next';
import { Closing } from '@/components/site/Closing';
import { Faq } from '@/components/site/Faq';
import { PageHeader } from '@/components/site/PageHeader';
import { Pricing } from '@/components/site/Pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start with a 14-day free trial. Basic ₹499 a month or Pro ₹999 a month, plus 18% GST. Save two months with yearly billing.',
};

export default function PricingPage() {
  return (
    <>
      <PageHeader title="Pay for the plan, not for every customer" intro="No limit on leads, customers, quotations or policies. Prices are per advisor account, plus 18% GST." />
      <Pricing heading={false} />
      <Faq />
      <Closing />
    </>
  );
}
