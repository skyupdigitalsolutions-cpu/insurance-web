import type { Metadata } from 'next';
import { LegalPage } from '@/components/site/LegalPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy policy' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="6 October 2026">
      <p>This policy explains what personal data {SITE.name} handles, why, and the choices you have. It is written for advisors who use the platform and for the customers whose details advisors store in it.</p>
      <h2>Who we are</h2>
      <p>{SITE.name} provides software that insurance advisors use to manage leads, customers, quotations, payments and renewals. For customer data that advisors enter, the advisor decides why and how it is used, and we process it on the advisor’s behalf. For advisor account data, we decide how it is used.</p>
      <h2>Data we handle</h2>
      <ul>
        <li>Advisor accounts: name, mobile number, email, IRDAI licence number, login and device records.</li>
        <li>Customer records entered by advisors: contact details, date of birth, family members, nominees, insurance needs, policies, payments and KYC documents.</li>
        <li>Website enquiries: the details you type into the contact form.</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To run the service: sign-in, storing records, sending quotations, payment links and reminders the advisor asks for.</li>
        <li>To keep it safe: preventing misuse, keeping an audit log, and meeting legal obligations.</li>
        <li>To answer enquiries and support requests.</li>
      </ul>
      <p>We do not sell personal data. Automatic WhatsApp messages are sent only to customers whose consent the advisor has recorded.</p>
      <h2>Where it is stored and who can see it</h2>
      <p>Data is stored with cloud providers in India. Each advisor’s records are visible only to that advisor and the team members they give access to. Service providers that help us run the platform (hosting, SMS, WhatsApp, email and payments) receive only what they need to do that job.</p>
      <h2>How long we keep it</h2>
      <p>We keep data while the advisor’s account is active and for as long as the law requires afterwards. Advisors can ask us to delete their account and the records in it.</p>
      <h2>Your rights</h2>
      <p>Under the Digital Personal Data Protection Act, 2023 you can ask to access, correct or erase your personal data, withdraw consent, and raise a grievance. Customers should contact their advisor first; advisors and anyone else can write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
      <h2>Changes</h2>
      <p>If this policy changes in a way that matters, we will tell advisors in the app before the change takes effect.</p>
    </LegalPage>
  );
}
