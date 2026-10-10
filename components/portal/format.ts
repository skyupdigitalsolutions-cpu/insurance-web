// Indian display formats used across the portal
export const rupees = (n: number | null | undefined) => (n == null ? 'Not available' : `₹${n.toLocaleString('en-IN')}`);

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

// "2026-10-11" (a calendar date) or an ISO date-time → "11 Oct 2026"
export function date(v: string | null | undefined): string {
  if (!v) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00+05:30`) : new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}
export const dateTime = (v: string | null | undefined) => (v ? dateTimeFmt.format(new Date(v)) : '—');

// "+919876543210" → "+91 98765 43210"
export const mobile = (m: string) => (/^\+91\d{10}$/.test(m) ? `+91 ${m.slice(3, 8)} ${m.slice(8)}` : m);

// Days until a calendar date, in words
export function dueIn(days: number): string {
  if (days === 0) return 'Due today';
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`;
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
}

export const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
