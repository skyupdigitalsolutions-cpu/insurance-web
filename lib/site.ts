// Company details shown on the website. Replace the placeholders when the details are final.
export const SITE = {
  name: 'Insurance Advisor',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  description:
    'Leads, quotations, payments and renewals in one place for insurance advisors in India. On your phone and on the web.',
  email: 'hello@insuranceadvisor.example',
  phone: '+91 80 0000 0000',
  address: 'Bengaluru, Karnataka, India',
  // Shown in the footer of every page. Fill in before going live.
  registration: 'IRDAI registration details will be shown here.',
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const NAV = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;
