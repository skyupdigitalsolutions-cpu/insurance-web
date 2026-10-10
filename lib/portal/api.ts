// Every call the advisor portal makes. Paths and shapes are the same as the mobile app's.
import { api, tokens } from './client';
import type {
  Activity, AppUser, AutodialList, BillingCycle, CallLog, CallOutcome, CallQueueItem, ChecklistItem, Checkout, Customer, CustomerDocument,
  DashboardSummary, DateRange, FamilyMember, KpiReport, Lead, LeadActivity, LeadStatus, Me, Message, MySubscription, NeedAnalysis,
  NewCustomerInput, NewLeadInput, NewReferralInput, NewTaskInput, NewUserInput, Nominee, OtpChallenge, Payment, PendingAction, Plan, Policy,
  Pricing, Product, QuoteInput, Quotation, Recommendation, Referral, RegistrationInput, RegistrationStatus, Renewal, RenewalWindow, Role, Task,
  Template,
} from './types';

type Items<T> = { items: T[] };

// ---------- session ----------
export type LoginResult = { accessToken: string; refreshToken: string; mustChangePassword: boolean };
export async function login(identifier: string, password: string, remember: boolean): Promise<LoginResult> {
  const r = await api<LoginResult>('/auth/login', { method: 'POST', body: { identifier, password }, auth: false });
  tokens.set(r.accessToken, r.refreshToken, remember);
  return r;
}
export const getMe = () => api<Me>('/auth/me');
export async function logout(): Promise<void> {
  try { await api('/auth/logout', { method: 'POST' }); } catch { /* already logged out */ }
  tokens.clear();
}
export const changePassword = (currentPassword: string, newPassword: string) =>
  api<void>('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });

// ---------- sign-up ----------
export const register = (input: RegistrationInput) => api<OtpChallenge>('/auth/register', { method: 'POST', body: input, auth: false });
export const resendOtp = (challengeId: string) => api<OtpChallenge>('/auth/otp/request', { method: 'POST', body: { challengeId }, auth: false });
export const verifyOtp = (challengeId: string, code: string) =>
  api<{ userId: string }>('/auth/otp/verify', { method: 'POST', body: { challengeId, code }, auth: false });
export const registrationStatus = async (userId: string) =>
  (await api<{ status: RegistrationStatus }>(`/auth/registrations/${userId}/status`, { auth: false })).status;

// ---------- dashboard ----------
export const dashboardSummary = (range: DateRange) => api<DashboardSummary>('/dashboard/summary', { query: { range } });
export const pendingActions = async () => (await api<Items<PendingAction>>('/dashboard/pending-actions', { query: { limit: 8 } })).items;
export const recentActivity = async () => (await api<Items<Activity>>('/activities', { query: { scope: 'recent', limit: 8 } })).items;

// ---------- leads ----------
export const listLeads = async (q: string, status: LeadStatus | 'ALL') =>
  (await api<Items<Lead>>('/leads', { query: { q, status: status === 'ALL' ? undefined : status } })).items;
export const getLead = (id: string) => api<Lead & { allowedTransitions: LeadStatus[] }>(`/leads/${id}`);
export const duplicateLead = async (mobile: string) =>
  (await api<{ match: Lead | null }>('/leads/duplicate-check', { method: 'POST', body: { mobile } })).match;
export const createLead = (input: NewLeadInput) => api<Lead>('/leads', { method: 'POST', body: input });
export const setLeadStatus = (id: string, status: LeadStatus, reason?: string) =>
  api<Lead>(`/leads/${id}/status`, { method: 'PATCH', body: { status, reason } });
export const logLeadActivity = (id: string, a: Omit<LeadActivity, 'id' | 'at'>) => api<Lead>(`/leads/${id}/activities`, { method: 'POST', body: a });
export const convertLead = (id: string) => api<Customer>(`/leads/${id}/convert`, { method: 'POST' });

// ---------- customers ----------
export const listCustomers = async (q: string) => (await api<Items<Customer>>('/customers', { query: { q } })).items;
export const getCustomer = (id: string) => api<Customer>(`/customers/${id}`);
export const createCustomer = (input: NewCustomerInput) => api<Customer>('/customers', { method: 'POST', body: input });
export const recordConsent = (id: string) => api<Customer>(`/customers/${id}/consents`, { method: 'POST', body: { purpose: 'data-processing' } });
export const listFamily = async (id: string) => (await api<Items<FamilyMember>>(`/customers/${id}/family`)).items;
export const addFamily = (input: Omit<FamilyMember, 'id'>) => api<FamilyMember>(`/customers/${input.customerId}/family`, { method: 'POST', body: input });
export const listNominees = async (id: string) => (await api<Items<Nominee>>(`/customers/${id}/nominees`)).items;
export const addNominee = (input: Omit<Nominee, 'id'>) => api<Nominee>(`/customers/${input.customerId}/nominees`, { method: 'POST', body: input });
export const removeNominee = (id: string) => api<void>(`/nominees/${id}`, { method: 'DELETE' });
export const listDocuments = async (id: string) => (await api<Items<CustomerDocument>>(`/customers/${id}/documents`)).items;
export function uploadDocument(customerId: string, type: string, file: File) {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  return api<CustomerDocument>(`/customers/${customerId}/documents`, { method: 'POST', form });
}
export const reviewDocument = (id: string, approve: boolean, reason?: string) =>
  api<CustomerDocument>(`/documents/${id}/review`, { method: 'POST', body: { decision: approve ? 'VERIFY' : 'REJECT', reason } });
export const getNeed = (customerId: string) => api<NeedAnalysis | null>(`/customers/${customerId}/need-analysis`);
export const saveNeed = (input: Omit<NeedAnalysis, 'updatedAt'>) =>
  api<NeedAnalysis>(`/customers/${input.customerId}/need-analysis`, { method: 'PUT', body: input });
export const recommendations = async (customerId: string) =>
  (await api<Items<Recommendation>>('/ai/recommendations', { method: 'POST', body: { customerId } })).items;

// ---------- products ----------
export const listProducts = async (type?: string) => (await api<Items<Product>>('/products', { query: { insuranceType: type } })).items;
export const getProduct = (id: string) => api<Product>(`/products/${id}`);
export const compareProducts = async (ids: string[]) => (await api<Items<Product>>('/comparisons', { method: 'POST', body: { productIds: ids } })).items;

// ---------- quotations, payments, policies ----------
export const calculateQuote = (input: QuoteInput) => api<{ pricing: Pricing; needsApproval: boolean }>('/quotations/calculate', { method: 'POST', body: input });
export const createQuote = (input: QuoteInput, approveDiscount: boolean) => api<Quotation>('/quotations', { method: 'POST', body: { ...input, approveDiscount } });
export const listQuotes = async (customerId?: string) => (await api<Items<Quotation>>('/quotations', { query: { customerId } })).items;
export const getQuote = (id: string) => api<Quotation>(`/quotations/${id}`);
export const sendQuote = (id: string, channel: 'WhatsApp' | 'Email' | 'Link' | 'In person' = 'WhatsApp') =>
  api<Quotation>(`/quotations/${id}/send`, { method: 'POST', body: { channel } });
export const approveQuote = (id: string) => api<Quotation>(`/quotations/${id}/approve`, { method: 'POST' });
export const acceptQuote = (id: string) => api<Quotation>(`/quotations/${id}/accept`, { method: 'POST' });
export const createPaymentLink = (quoteId: string, method: string) => api<Payment>(`/quotations/${quoteId}/payment-link`, { method: 'POST', body: { method } });
export const listPayments = async () => (await api<Items<Payment>>('/payments')).items;
export const getPayment = (id: string) => api<Payment>(`/payments/${id}`);
export const retryPayment = (id: string) => api<Payment>(`/payments/${id}/retry`, { method: 'POST' });
export const listPolicies = async (q: { customerId?: string; quotationId?: string } = {}) => (await api<Items<Policy>>('/policies', { query: q })).items;
export const getPolicy = (id: string) => api<Policy>(`/policies/${id}`);
export const issuanceChecklist = async (id: string) => (await api<Items<ChecklistItem>>(`/policies/${id}/issuance-checklist`)).items;
export const issuePolicy = (id: string) => api<Policy>(`/policies/${id}/issue`, { method: 'POST' });

// ---------- renewals, referrals, tasks, messages ----------
export const listRenewals = async (window: RenewalWindow) => (await api<Items<Renewal>>('/renewals', { query: { window } })).items;
export const getRenewal = (id: string) => api<Renewal>(`/renewals/${id}`);
export const logRenewalContact = (id: string, outcome: string, notes?: string) => api<Renewal>(`/renewals/${id}/activities`, { method: 'POST', body: { outcome, notes } });
export const closeRenewal = (id: string, reason: string) => api<Renewal>(`/renewals/${id}/status`, { method: 'PATCH', body: { status: 'CLOSED', reason } });
export const listReferrals = async () => (await api<Items<Referral>>('/referrals')).items;
export const createReferral = (input: NewReferralInput) => api<Referral>('/referrals', { method: 'POST', body: input });
export const listTasks = async () => (await api<Items<Task>>('/tasks')).items;
export const createTask = (input: NewTaskInput) => api<Task>('/tasks', { method: 'POST', body: input });
export const setTaskDone = (id: string, done: boolean) => api<Task>(`/tasks/${id}`, { method: 'PATCH', body: { done } });
export const listTemplates = async () => (await api<Items<Template>>('/templates', { query: { status: 'approved' } })).items;
export const previewMessage = async (templateId: string, customerId: string) =>
  (await api<{ text: string }>('/communications/preview', { method: 'POST', body: { templateId, customerId } })).text;
export const sendMessage = (customerId: string, templateId: string) => api<Message>('/communications/send', { method: 'POST', body: { customerId, templateId } });
export const listMessages = async () => (await api<Items<Message>>('/communications')).items;

// ---------- autodial, reports, team ----------
export const callQueue = async (list: AutodialList) => (await api<Items<CallQueueItem>>('/autodial/queue', { query: { list } })).items;
export const logCall = (item: CallQueueItem, outcome: CallOutcome, notes: string | undefined, durationSec: number) =>
  api<CallLog>('/autodial/calls', { method: 'POST', body: { kind: item.kind, refId: item.refId, outcome, notes, durationSec } });
export const callLogs = async () => (await api<Items<CallLog>>('/autodial/calls')).items;
export const kpiReport = () => api<KpiReport>('/reports/kpis');
export const listRoles = async () => (await api<Items<Role>>('/roles')).items;
export const saveRole = (input: { id?: string; name: string; permissions: string[] }) =>
  input.id ? api<Role>(`/roles/${input.id}`, { method: 'PATCH', body: { name: input.name, permissions: input.permissions } })
    : api<Role>('/roles', { method: 'POST', body: { name: input.name, permissions: input.permissions } });
export const listUsers = async () => (await api<Items<AppUser>>('/users')).items;
export const createUser = (input: NewUserInput) => api<AppUser>('/users', { method: 'POST', body: input });
export const setUserActive = (id: string, active: boolean) => api<AppUser>(`/users/${id}`, { method: 'PATCH', body: { active } });

// ---------- subscription ----------
export const listPlans = async () => (await api<Items<Plan>>('/subscription/plans', { auth: false })).items;
export const mySubscription = () => api<MySubscription>('/subscription');
export const startCheckout = (planId: Plan['id'], cycle: BillingCycle) => api<Checkout>('/subscription/checkout', { method: 'POST', body: { planId, cycle } });
export const getCheckout = (id: string) => api<Checkout>(`/subscription/checkout/${id}`);
export const setAutoRenew = (on: boolean) => api<MySubscription>('/subscription', { method: 'PATCH', body: { autoRenew: on } });
