'use client';

import { Suspense } from 'react';
import { QuoteBuilder } from '@/components/portal/quotes/QuoteBuilder';
import { Loading } from '@/components/portal/ui';

export default function NewQuotationPage() {
  // Reads ?customerId / ?productId, so it needs a Suspense boundary
  return <Suspense fallback={<Loading />}><QuoteBuilder /></Suspense>;
}
