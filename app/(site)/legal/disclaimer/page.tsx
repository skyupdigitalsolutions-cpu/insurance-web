import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Disclaimer' };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="6 October 2026">
      <p>{SITE.name} is a software platform used by insurance advisors. It is not an insurance company and does not solicit, sell or advise on insurance.</p>
      <p>Insurance products shown inside the platform are offered by the respective insurers through registered advisors. Premiums, cover and features shown are indicative and depend on the insurer’s underwriting and policy terms. Read the sales brochure and policy wording carefully before buying.</p>
      <p>Names, numbers and screens on this website are examples used to show how the product works.</p>
      <p>{SITE.registration}</p>
    </LegalPage>
  );
}
