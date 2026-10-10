import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Terms of use' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="6 October 2026">
      <p>These terms apply to anyone who creates an account on {SITE.name} or uses the website.</p>
      <h2>The service</h2>
      <p>{SITE.name} is software for insurance advisors. We are not an insurer, an insurance intermediary or an advisor, and we do not recommend or sell insurance products.</p>
      <h2>Your account</h2>
      <ul>
        <li>You must hold a valid licence to act as an insurance advisor, and the details you give at sign-up must be true.</li>
        <li>You are responsible for everything done through your account and your team members’ accounts. Keep your password private.</li>
        <li>You must have the customer’s permission before storing their details or sending them messages.</li>
      </ul>
      <h2>Plans and payment</h2>
      <p>New accounts get a 14-day free trial. After that a paid plan is needed to keep using paid features. Prices are shown on the pricing page and include 18% GST on top. Paid plans keep working for 3 days after the renewal date. Fees already paid are not refunded for part of a period unless the law requires it.</p>
      <h2>Product information</h2>
      <p>Product details, premiums and suggestions in the app come from information supplied by insurers and administrators. Always check the insurer’s policy wording before advising a customer.</p>
      <h2>Acceptable use</h2>
      <p>Do not use the service to send unsolicited messages, upload content you have no right to, or try to access other accounts or disrupt the platform.</p>
      <h2>Ending the service</h2>
      <p>You can stop using the service at any time. We may suspend accounts that break these terms or the law.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
    </LegalPage>
  );
}
