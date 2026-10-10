// Data shapes returned by the backend (/api/v1). Same as the mobile app's src/types, so both stay in step.

// Data shapes for modules 03–10 (Leads → Policy)

// ---------- Leads ----------
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'QUOTATION' | 'FOLLOW_UP' | 'CONVERTED' | 'LOST';
export type LeadSource = 'Referral' | 'Paid Ads' | 'Campaign' | 'Other';

export type LeadActivity = {
  id: string;
  type: 'Call' | 'WhatsApp' | 'Email' | 'Meeting';
  outcome: string;
  notes?: string;
  at: string; // ISO date-time
};

export type Lead = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  source: LeadSource;
  referralCode?: string;
  campaign?: string;
  requirement?: string;
  notes?: string;
  status: LeadStatus;
  lostReason?: string;
  customerId?: string; // set after "Convert to customer"
  createdAt: string;
  activities: LeadActivity[];
};

export type NewLeadInput = Pick<Lead, 'name' | 'mobile' | 'email' | 'source' | 'referralCode' | 'campaign' | 'requirement' | 'notes'>;

// ---------- Customers ----------
export type Customer = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  dob?: string; // YYYY-MM-DD
  city?: string;
  pin?: string;
  source: string;
  leadId?: string;
  consentGiven: boolean;
  consentAt?: string;
  createdAt: string;
};

export type NewCustomerInput = Pick<Customer, 'name' | 'mobile' | 'email' | 'dob' | 'city' | 'pin'> & { source?: string; leadId?: string };

export type FamilyMember = { id: string; customerId: string; name: string; relationship: string; dob?: string };

export type Nominee = { id: string; customerId: string; name: string; relationship: string; percent: number };

export type DocumentStatus = 'Uploaded' | 'Review Required' | 'Verified' | 'Rejected';
export type CustomerDocument = {
  id: string; customerId: string; type: string; status: DocumentStatus; uploadedAt: string;
  uri: string;           // real backend: a view link that works for 15 minutes
  mimeType?: string;
  rejectReason?: string;
};

// ---------- Need analysis ----------
export type InsuranceType = 'Health' | 'Life' | 'Motor';

export type NeedAnalysis = {
  customerId: string;
  insuranceType: InsuranceType;
  need: string;
  coverage?: number;  // rupees
  budget?: number;    // rupees per year
  members?: number;
  notes?: string;
  updatedAt: string;
};

// ---------- Products ----------
export type AddOn = { id: string; name: string; premium: number };

// null = information not available (show "Not available", never invent)
export type Product = {
  id: string;
  name: string;
  companyName: string;
  type: InsuranceType;
  basePremium: number | null; // yearly, rupees
  coverage: string | null;
  features: string[];
  addOns: AddOn[];
  exclusions: string | null;
  eligibility: string | null;
  minAge?: number;
  maxAge?: number;
  source: string | null;
};

export type Recommendation = { product: Product; reasons: string[]; warnings: string[] };

// ---------- Quotations ----------
export type QuoteStatus = 'DRAFT' | 'GENERATED' | 'SENT' | 'ACCEPTED' | 'PAYMENT_PENDING' | 'PAID' | 'CANCELLED';
export type Frequency = 'Yearly' | 'Monthly';

export type Pricing = {
  base: number;
  addOns: number;
  subtotal: number;
  discount: number;
  gst: number;
  total: number; // final payable
};

export type Quotation = {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  companyName: string;
  type: InsuranceType;
  addOnIds: string[];
  frequency: Frequency;
  discountPercent: number;
  discountReason?: string;
  approvalStatus: 'NONE' | 'PENDING' | 'APPROVED';
  pricing: Pricing;
  comparedProductIds: string[];
  status: QuoteStatus;
  createdAt: string;
  validUntil?: string; // real backend: quotations are valid for 30 days
  pdfUrl?: string;     // real backend: PDF link valid for 15 minutes
};

export type QuoteInput = {
  customerId: string;
  productId: string;
  addOnIds: string[];
  frequency: Frequency;
  discountPercent: number;
  discountReason?: string;
  comparedProductIds: string[];
};

// ---------- Payments & Policies ----------
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type Payment = {
  id: string;
  quotationId: string;
  quoteNumber: string;
  customerName: string;
  amount: number;
  method: string;
  link: string;
  status: PaymentStatus;
  transactionRef?: string;
  failureReason?: string;
  createdAt: string;
  paidAt?: string;
};

export type PolicyStatus = 'PENDING_ISSUANCE' | 'ACTIVE';
export type Policy = {
  id: string;
  policyNumber?: string;
  quotationId: string;
  customerId: string;
  customerName: string;
  productName: string;
  companyName: string;
  premium: number;
  status: PolicyStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

export type ChecklistItem = { key: string; label: string; passed: boolean; fixHint: string };

// Data shapes for modules 11–14 and the finishing modules

// ---------- Renewals ----------
export type RenewalStatus = 'Upcoming' | 'Contacted' | 'Quoted' | 'Renewed' | 'Overdue' | 'Closed';
export type RenewalWindow = 'overdue' | '7d' | '30d' | 'all';

export type RenewalContact = { id: string; outcome: string; notes?: string; at: string };

export type Renewal = {
  id: string; // same as the policy id
  policyNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  productId: string | null;
  productName: string;
  companyName: string;
  premium: number;
  dueDate: string; // policy expiry date
  daysLeft: number; // negative = overdue
  status: RenewalStatus;
  contacts: RenewalContact[];
  closedReason?: string;
};

// ---------- Referrals ----------
export type ReferralStatus = 'Assigned' | 'Converted' | 'Rejected';
export type Referral = {
  id: string;
  referrerName: string;
  code?: string;
  name: string;
  mobile: string;
  relationship: string;
  interest: string;
  leadId: string;
  status: ReferralStatus;
  createdAt: string;
};
export type NewReferralInput = {
  referrerCustomerId?: string;
  code?: string;
  name: string;
  mobile: string;
  relationship: string;
  interest: string;
};

// ---------- Tasks ----------
export type TaskType = 'Call' | 'Visit' | 'Documents' | 'Payment follow-up' | 'Other';
export type Task = { id: string; title: string; type: TaskType; due: string; relatedTo?: string; done: boolean; createdAt: string };
export type NewTaskInput = Pick<Task, 'title' | 'type' | 'due' | 'relatedTo'>;

// ---------- Users, roles, session ----------
export type Role = { id: string; name: string; permissions: string[]; system: boolean };
export type AppUser = {
  id: string; name: string; email: string; mobile: string; roleId: string; roleName: string; active: boolean;
  temporaryPassword?: string; // returned once by the real backend when a user is created
};
export type NewUserInput = { name: string; email: string; mobile: string; roleId: string };
export type Me = {
  id: string; name: string; email: string; mobile: string; roleName: string; permissions: string[];
  orgId: string | null; isPlatformAdmin: boolean; mustChangePassword: boolean;
};

// ---------- Communications ----------
export type Channel = 'WhatsApp' | 'Email';
export type Template = { id: string; name: string; event: string; channel: Channel; body: string };
export type Message = {
  id: string; customerId: string; customerName: string; channel: Channel;
  templateName: string; text: string; status: 'Sent' | 'Delivered' | 'Failed'; sentAt: string;
};

// ---------- Reports ----------
export type KpiRate = { label: string; value: string; formula: string };
export type KpiReport = {
  funnel: { label: string; value: number }[];
  rates: KpiRate[];
  comparison: KpiRate[];
};

// Data shapes for Part 5: registration, subscription, autodial

// ---------- Registration ----------
export type RegistrationInput = {
  name: string;
  mobile: string;    // E.164, e.g. +919876543210
  email: string;
  password: string;
  irdaiNumber?: string;
};
export type OtpChallenge = { challengeId: string; userId: string; maskedMobile: string; resendAfterSec: number };
export type RegistrationStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'REJECTED';

// ---------- Subscription ----------
export type FeatureKey = 'crm' | 'quotes' | 'renewals' | 'reports' | 'ai' | 'autodial' | 'whatsapp' | 'team';
export type BillingCycle = 'monthly' | 'yearly';
export type Plan = {
  id: 'trial' | 'basic' | 'pro';
  name: string;
  tagline: string;
  monthly: number;   // rupees, before GST
  yearly: number;    // rupees, before GST
  users: number;
  features: FeatureKey[];
  popular?: boolean;
};
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type Invoice = { id: string; number: string; planName: string; cycle: BillingCycle; amount: number; gst: number; total: number; paidAt: string };
export type MySubscription = {
  plan: Plan;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  renewsAt: string;      // or trial end date
  daysLeft: number;
  autoRenew: boolean;
  features: FeatureKey[];
  isOwner: boolean;      // only the account owner can change the plan
  invoices: Invoice[];
};
export type Checkout = { checkoutId: string; planName: string; cycle: BillingCycle; amount: number; gst: number; total: number; url: string; status: 'PENDING' | 'PAID' | 'FAILED' };

// ---------- Autodial ----------
export type AutodialList = 'new_leads' | 'open_leads' | 'renewals';
export type CallQueueItem = { id: string; kind: 'lead' | 'renewal'; refId: string; name: string; mobile: string; subtitle: string };
export type CallOutcome = 'Connected' | 'No answer' | 'Busy' | 'Call back' | 'Not interested' | 'Wrong number';
export type CallLog = { id: string; name: string; mobile: string; kind: 'lead' | 'renewal'; outcome: CallOutcome; notes?: string; durationSec: number; at: string };

// Shapes of the data the Dashboard receives from the backend

export type DateRange = 'today' | '7d' | '30d' | 'month';

export type DashboardSummary = {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  qualified: number;
  quotes: number;
  accepted: number;
  paid: number;
  policies: number;
  renewalsDue: number;
  activeCustomers: number;
};

export type PendingActionType =
  | 'quote' | 'payment' | 'document' | 'approval' | 'followup' | 'renewal' | 'issuance';

export type PendingAction = {
  id: string;
  type: PendingActionType;
  title: string;
  customerName: string;
  dueLabel: string; // e.g. "Due today", "2 days overdue"
  isOverdue: boolean;
  // Real backend: which screen opens the item, and its id there
  target?: 'quote' | 'payment' | 'policy' | 'customer' | 'task';
  targetId?: string;
};

export type RenewalDue = {
  id: string;
  customerName: string;
  policyNumber: string;
  insurer: string;
  premium: number; // rupees
  dueDate: string; // ISO date, e.g. "2026-10-02"
};

export type Activity = {
  id: string;
  text: string;
  time: string; // ISO date-time
};
