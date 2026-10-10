// Choice lists and status colours, the same as the mobile app
import type { Tone } from './ui';

export const LEAD_SOURCES = ['Referral', 'Paid Ads', 'Campaign', 'Other'] as const;
export const CONTACT_TYPES = ['Call', 'WhatsApp', 'Email', 'Meeting'] as const;
export const LEAD_OUTCOMES = ['Connected', 'No answer', 'Call back', 'Not interested'] as const;
export const RENEWAL_OUTCOMES = ['Will renew', 'Call back later', 'Wants a better price', 'No answer'] as const;
export const DOC_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Photo', 'Other'] as const;
export const FAMILY_RELATIONSHIPS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Other'] as const;
export const REFERRAL_RELATIONSHIPS = ['Family', 'Friend', 'Colleague', 'Neighbour', 'Other'] as const;
export const INSURANCE_TYPES = ['Health', 'Life', 'Motor'] as const;
export const TASK_TYPES = ['Call', 'Visit', 'Documents', 'Payment follow-up', 'Other'] as const;
export const PAYMENT_METHODS = ['Payment link', 'UPI', 'Card', 'Net banking'] as const;
export const CALL_OUTCOMES = ['Connected', 'No answer', 'Busy', 'Call back', 'Not interested', 'Wrong number'] as const;

export const LEAD_STATUS: Record<string, [string, Tone]> = {
  NEW: ['New', 'blue'], CONTACTED: ['Contacted', 'blue'], QUALIFIED: ['Qualified', 'blue'], QUOTATION: ['Quotation', 'amber'],
  FOLLOW_UP: ['Follow up', 'amber'], CONVERTED: ['Converted', 'green'], LOST: ['Lost', 'grey'],
};
export const QUOTE_STATUS: Record<string, [string, Tone]> = {
  DRAFT: ['Waiting for approval', 'amber'], GENERATED: ['Ready to send', 'blue'], SENT: ['Sent', 'blue'], ACCEPTED: ['Accepted', 'green'],
  PAYMENT_PENDING: ['Payment pending', 'amber'], PAID: ['Paid', 'green'], CANCELLED: ['Cancelled', 'grey'],
};
export const PAYMENT_STATUS: Record<string, [string, Tone]> = { PENDING: ['Waiting for payment', 'amber'], SUCCESS: ['Paid', 'green'], FAILED: ['Failed', 'red'] };
export const POLICY_STATUS: Record<string, [string, Tone]> = { PENDING_ISSUANCE: ['Waiting for issue', 'amber'], ACTIVE: ['Active', 'green'] };
export const RENEWAL_STATUS: Record<string, Tone> = { Upcoming: 'blue', Contacted: 'blue', Quoted: 'amber', Renewed: 'green', Overdue: 'red', Closed: 'grey' };
export const DOC_STATUS: Record<string, Tone> = { Uploaded: 'blue', 'Review Required': 'amber', Verified: 'green', Rejected: 'red' };
export const label = (map: Record<string, [string, Tone]>, key: string): [string, Tone] => map[key] ?? [key, 'grey'];
