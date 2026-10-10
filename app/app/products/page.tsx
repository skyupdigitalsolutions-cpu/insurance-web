'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { rupees } from '@/components/portal/format';
import { useSession } from '@/components/portal/session';
import { Button, ButtonLink, Dialog, Empty, ErrorNote, Loading, PageHead, Segmented } from '@/components/portal/ui';
import { compareProducts, listProducts } from '@/lib/portal/api';
import type { InsuranceType, Product } from '@/lib/portal/types';

const TYPES = [['Health', 'Health'], ['Life', 'Life'], ['Motor', 'Motor']] as const;
const na = (v: string | null | undefined) => v ?? <span className="text-muted">Not available</span>;

export default function ProductsPage() {
  const { can } = useSession();
  const [type, setType] = useState<InsuranceType>('Health');
  const [picked, setPicked] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const products = useQuery({ queryKey: ['products', type], queryFn: () => listProducts(type) });
  const compare = useQuery({ queryKey: ['compare', picked], queryFn: () => compareProducts(picked), enabled: comparing });
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));

  return (
    <>
      <PageHead title="Products" sub="The company's approved catalogue. Missing details are shown as “Not available”, never guessed."
        actions={<Button disabled={picked.length < 2} onClick={() => setComparing(true)}>Compare {picked.length ? `(${picked.length})` : ''}</Button>} />
      <div className="mb-4"><Segmented label="Insurance type" value={type} options={TYPES} onChange={(t) => { setType(t); setPicked([]); }} /></div>
      <ErrorNote error={products.error} retry={() => void products.refetch()} />
      {products.isLoading ? <Loading /> : products.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.data.map((p) => (
            <article key={p.id} className={`flex flex-col rounded-2xl bg-white p-5 ring-1 ${picked.includes(p.id) ? 'ring-2 ring-blue' : 'ring-line'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-display text-[18px] font-semibold text-ink">{p.name}</h2><p className="text-[14px] text-muted">{p.companyName}</p></div>
                <label className="flex items-center gap-2 text-[13.5px] text-muted"><input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[#3a75c4]" disabled={!picked.includes(p.id) && picked.length >= 3} />Compare</label>
              </div>
              <p className="tabular mt-4 font-display text-[26px] font-semibold text-ink">{p.basePremium != null ? rupees(p.basePremium) : 'Not available'}<span className="ml-1 text-[14px] font-normal text-muted">{p.basePremium != null && 'per year, before add-ons'}</span></p>
              <p className="mt-1 text-[14.5px] text-ink">{na(p.coverage)}</p>
              <ul className="mt-3 flex-1 space-y-1 text-[14px] text-muted">{p.features.slice(0, 4).map((f) => <li key={f}>✓ {f}</li>)}</ul>
              {p.addOns.length > 0 && <p className="mt-3 text-[13.5px] text-muted">Add-ons: {p.addOns.map((a) => a.name).join(', ')}</p>}
              {can('quotation:create') && <div className="mt-4"><ButtonLink href={`/app/quotations/new?productId=${p.id}`} variant="secondary">Quote this</ButtonLink></div>}
            </article>
          ))}
        </div>
      ) : <Panelless />}
      {comparing && (
        <Dialog title="Compare products" wide onClose={() => setComparing(false)} footer={<Button variant="secondary" onClick={() => setComparing(false)}>Close</Button>}>
          {compare.isLoading ? <Loading /> : compare.error ? <ErrorNote error={compare.error} /> : <CompareTable items={compare.data ?? []} />}
        </Dialog>
      )}
    </>
  );
}

const Panelless = () => <div className="rounded-2xl bg-white ring-1 ring-line"><Empty title="No products of this type" text="The company adds products from the admin panel." /></div>;

function CompareTable({ items }: { items: Product[] }) {
  const rows: [string, (p: Product) => React.ReactNode][] = [
    ['Insurer', (p) => p.companyName], ['Premium per year', (p) => (p.basePremium != null ? rupees(p.basePremium) : na(null))], ['Cover', (p) => na(p.coverage)],
    ['Key features', (p) => (p.features.length ? p.features.join(' · ') : na(null))], ['Add-ons', (p) => (p.addOns.length ? p.addOns.map((a) => `${a.name} (${rupees(a.premium)})`).join(', ') : 'None')],
    ['Exclusions', (p) => na(p.exclusions)], ['Eligibility', (p) => na(p.eligibility)], ['Age', (p) => (p.minAge != null || p.maxAge != null ? `${p.minAge ?? '—'}–${p.maxAge ?? '—'} years` : na(null))],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[14px]">
        <thead><tr><th className="w-36" />{items.map((p) => <th key={p.id} className="px-3 pb-3 text-left font-display text-[16px] font-semibold text-ink">{p.name}</th>)}</tr></thead>
        <tbody>{rows.map(([k, f]) => (
          <tr key={k} className="border-t border-line align-top"><th className="py-2.5 pr-3 text-left font-normal text-muted">{k}</th>{items.map((p) => <td key={p.id} className="px-3 py-2.5 text-ink">{f(p)}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}
