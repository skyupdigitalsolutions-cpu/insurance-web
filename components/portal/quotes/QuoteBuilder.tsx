'use client';

// New quotation on one screen: customer → product → add-ons → frequency → discount, with the server's price
// updating as you choose. Nothing is saved until "Create quotation".
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import { calculateQuote, createQuote, getProduct, listCustomers, listProducts } from '@/lib/portal/api';
import type { Frequency, InsuranceType, QuoteInput } from '@/lib/portal/types';
import { rupees } from '../format';
import { INSURANCE_TYPES } from '../options';
import { useSession } from '../session';
import { Button, ErrorNote, Input, Loading, Notice, PageHead, Panel, Segmented, Select } from '../ui';

export function QuoteBuilder() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { can, has } = useSession();
  const [customerId, setCustomerId] = useState(params.get('customerId') ?? '');
  const [productId, setProductId] = useState(params.get('productId') ?? '');
  const preset = useQuery({ queryKey: ['product', productId], queryFn: () => getProduct(productId), enabled: !!params.get('productId') });
  const [typeChoice, setTypeChoice] = useState<InsuranceType | null>(null);
  const type: InsuranceType = typeChoice ?? preset.data?.type ?? 'Health';
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency>('Yearly');
  const [discount, setDiscount] = useState('0');
  const [reason, setReason] = useState('');
  const [approveNow, setApproveNow] = useState(false);

  const customers = useQuery({ queryKey: ['customers', ''], queryFn: () => listCustomers('') });
  const products = useQuery({ queryKey: ['products', type], queryFn: () => listProducts(type) });
  const product = products.data?.find((p) => p.id === productId);
  const pct = Number(discount) || 0;

  const input: QuoteInput | null = customerId && productId && product ? {
    customerId, productId, addOnIds, frequency, discountPercent: pct, ...(reason.trim() ? { discountReason: reason.trim() } : {}),
    comparedProductIds: [],
  } : null;
  const priced = useDeferredValue(input);
  const key = useMemo(() => JSON.stringify(priced), [priced]);
  const price = useQuery({ queryKey: ['quote-price', key], queryFn: () => calculateQuote(priced!), enabled: !!priced && product?.basePremium != null, retry: false });

  const create = useMutation({
    mutationFn: () => createQuote(input!, approveNow),
    onSuccess: async (q) => { await qc.invalidateQueries({ queryKey: ['quotes'] }); router.push(`/app/quotations/${q.id}`); },
  });

  if (!has('quotes')) return <Notice tone="amber">Your plan does not include quotations. Renew or upgrade in Subscription.</Notice>;
  const p = price.data?.pricing;
  const needsApproval = price.data?.needsApproval ?? false;
  const blocked = !input || product?.basePremium == null || (pct > 0 && !reason.trim()) || price.isError;

  return (
    <>
      <PageHead back={{ href: '/app/quotations', label: 'Quotations' }} title="New quotation" sub="Prices come from the product catalogue. The quotation keeps a copy, so later price changes never alter it." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Customer">
            {customers.isLoading ? <Loading /> : (
              <Select label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Choose a customer</option>
                {customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.mobile}</option>)}
              </Select>
            )}
          </Panel>
          <Panel title="Product">
            <div className="mb-4"><Segmented label="Insurance type" value={type} options={INSURANCE_TYPES.map((t) => [t, t] as const)} onChange={(t) => { setTypeChoice(t); setProductId(''); setAddOnIds([]); }} /></div>
            {products.isLoading ? <Loading /> : (
              <fieldset className="grid gap-2">
                <legend className="sr-only">Product</legend>
                {products.data?.map((pr) => (
                  <label key={pr.id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 ring-1 ${productId === pr.id ? 'bg-mist ring-blue' : 'ring-line hover:bg-paper'}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="product" checked={productId === pr.id} onChange={() => { setProductId(pr.id); setAddOnIds([]); }} className="accent-[#3a75c4]" />
                      <span><span className="block font-semibold text-ink">{pr.name}</span><span className="block text-[13.5px] text-muted">{pr.companyName} · {pr.coverage ?? 'Cover not available'}</span></span>
                    </span>
                    <span className="tabular whitespace-nowrap font-semibold">{pr.basePremium != null ? rupees(pr.basePremium) : 'Not available'}</span>
                  </label>
                ))}
              </fieldset>
            )}
            {product && product.basePremium == null && <p className="mt-3 text-[14px] text-[#94590a]">This product has no published premium, so it cannot be quoted. Ask the insurer, or choose another.</p>}
          </Panel>
          {product && product.addOns.length > 0 && (
            <Panel title="Add-ons">
              <div className="grid gap-2">
                {product.addOns.map((a) => (
                  <label key={a.id} className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 ring-1 ring-line">
                    <span className="flex items-center gap-3"><input type="checkbox" className="h-4 w-4 accent-[#3a75c4]" checked={addOnIds.includes(a.id)}
                      onChange={() => setAddOnIds((x) => (x.includes(a.id) ? x.filter((i) => i !== a.id) : [...x, a.id]))} />{a.name}</span>
                    <span className="tabular text-muted">+ {rupees(a.premium)}</span>
                  </label>
                ))}
              </div>
            </Panel>
          )}
          <Panel title="Payment and discount">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Premium paid" value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}><option>Yearly</option><option>Monthly</option></Select>
              {can('quotation:discount') ? (
                <Input label="Discount (%)" type="number" min={0} max={25} value={discount} onChange={(e) => setDiscount(e.target.value)} hint="Up to 10% on your own; up to 25% with approval" />
              ) : <p className="self-end text-[14px] text-muted">Your role cannot give discounts.</p>}
              {pct > 0 && <div className="sm:col-span-2"><Input label="Reason for the discount" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Loyal customer, second policy" /></div>}
            </div>
          </Panel>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <Panel title="Price">
            {!input ? <p className="text-muted">Choose a customer and a product to see the price.</p> : price.isLoading ? <Loading /> : price.error ? <ErrorNote error={price.error} /> : p && (
              <dl className="space-y-2 text-[15px]">
                {([['Base premium', p.base], ['Add-ons', p.addOns], ['Discount', -p.discount], ['GST', p.gst]] as [string, number][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="tabular">{v < 0 ? `− ${rupees(-v)}` : rupees(v)}</dd></div>
                ))}
                <div className="flex justify-between border-t border-line pt-3 font-display text-[22px] font-semibold"><dt>Total</dt><dd className="tabular">{rupees(p.total)}</dd></div>
                <p className="text-[13px] text-muted">{type === 'Motor' ? 'Motor insurance carries 18% GST.' : `${type} insurance is GST-exempt.`}</p>
              </dl>
            )}
            {needsApproval && (
              <div className="mt-4 rounded-xl bg-[#fdf0db] px-4 py-3 text-[14px] text-[#7a4a08]">
                Discounts above 10% need approval. The quotation is saved as waiting for approval.
                {can('quotation:approve') && <label className="mt-2 flex items-center gap-2 font-semibold"><input type="checkbox" checked={approveNow} onChange={(e) => setApproveNow(e.target.checked)} className="accent-[#3a75c4]" />Approve it now</label>}
              </div>
            )}
            <ErrorNote error={create.error} />
            <Button className="mt-5 w-full" disabled={blocked} busy={create.isPending} onClick={() => create.mutate()}>Create quotation</Button>
          </Panel>
        </div>
      </div>
    </>
  );
}
