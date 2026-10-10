// Permission codes, in the "resource:action" format from the SRS §8.1.
// The backend decides who has which permission; the app only hides what the user can't use.

export const PERMISSION_GROUPS: { area: string; items: { code: string; label: string }[] }[] = [
  { area: 'Dashboard', items: [{ code: 'dashboard:read', label: 'View dashboard' }] },
  { area: 'Leads', items: [
    { code: 'lead:read', label: 'View leads' }, { code: 'lead:create', label: 'Create leads' }, { code: 'lead:update', label: 'Update / convert leads' },
  ] },
  { area: 'Customers', items: [
    { code: 'customer:read', label: 'View customers' }, { code: 'customer:create', label: 'Create customers' }, { code: 'customer:update', label: 'Edit customers, family, documents' },
  ] },
  { area: 'Products', items: [{ code: 'product:read', label: 'View products' }] },
  { area: 'Quotations', items: [
    { code: 'quotation:read', label: 'View quotations' }, { code: 'quotation:create', label: 'Create and send quotations' },
    { code: 'quotation:discount', label: 'Give discounts' }, { code: 'quotation:approve', label: 'Approve discounts above limit' },
  ] },
  { area: 'Payments', items: [{ code: 'payment:read', label: 'View payments' }, { code: 'payment:create', label: 'Request payments' }] },
  { area: 'Policies', items: [{ code: 'policy:read', label: 'View policies' }, { code: 'policy:issue', label: 'Issue policies' }] },
  { area: 'Renewals', items: [{ code: 'renewal:read', label: 'View renewals' }, { code: 'renewal:manage', label: 'Manage renewals' }] },
  { area: 'Referrals', items: [{ code: 'referral:read', label: 'View referrals' }, { code: 'referral:create', label: 'Record referrals' }] },
  { area: 'Tasks & messages', items: [{ code: 'task:read', label: 'Tasks & follow-ups' }, { code: 'communication:send', label: 'Send messages' }] },
  { area: 'Reports', items: [{ code: 'report:read', label: 'View reports & KPIs' }] },
  { area: 'Users & roles', items: [{ code: 'user:manage', label: 'Create users, roles and permissions' }] },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.code));
