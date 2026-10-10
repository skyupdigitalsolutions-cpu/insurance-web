'use client';

import { Suspense } from 'react';
import { AccountSettings } from '@/components/portal/AccountSettings';
import { Loading } from '@/components/portal/ui';

export default function SettingsPage() {
  return <Suspense fallback={<Loading />}><AccountSettings /></Suspense>;
}
