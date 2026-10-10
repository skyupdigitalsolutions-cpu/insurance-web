import { API_URL } from './site';

// Plans come from the backend (GET /subscription/plans, public). If the API cannot be reached,
// the same values are shown from here so the page never breaks.
export type Plan = {
  id: 'trial' | 'basic' | 'pro';
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  users: number;
  features: string[];
  popular?: boolean;
};

export const FEATURE_NAMES: Record<string, string> = {
  crm: 'Leads, customers and documents',
  quotes: 'Quotations and payment links',
  renewals: 'Renewals and reminders',
  reports: 'Reports',
  ai: 'AI recommendations',
  autodial: 'Autodial call lists',
  whatsapp: 'Automatic WhatsApp reminders',
  team: 'Team access with roles',
};

export const FALLBACK_PLANS: Plan[] = [
  { id: 'trial', name: 'Free Trial', tagline: '14 days with every feature', monthly: 0, yearly: 0, users: 5, features: Object.keys(FEATURE_NAMES) },
  { id: 'basic', name: 'Basic', tagline: 'For individual advisors', monthly: 499, yearly: 4990, users: 1, features: ['crm', 'quotes', 'renewals', 'reports'] },
  { id: 'pro', name: 'Pro', tagline: 'AI, Autodial and team access', monthly: 999, yearly: 9990, users: 5, features: Object.keys(FEATURE_NAMES), popular: true },
];

export const GST_RATE = 0.18;

export async function fetchPlans(signal?: AbortSignal): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_URL}/subscription/plans`, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return FALLBACK_PLANS;
    const body = (await res.json()) as { items?: Plan[] };
    return body.items?.length ? body.items : FALLBACK_PLANS;
  } catch {
    return FALLBACK_PLANS;
  }
}

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
