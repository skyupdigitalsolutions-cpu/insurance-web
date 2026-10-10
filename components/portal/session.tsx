'use client';

// Who is logged in, what they may do, and which plan features they have.
// The server checks every permission and plan feature again; this only decides what to show.
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { getMe, logout as apiLogout, mySubscription } from '@/lib/portal/api';
import { ApiError, setSessionEndedHandler, tokens } from '@/lib/portal/client';
import type { FeatureKey, Me, MySubscription } from '@/lib/portal/types';

type Session = {
  me: Me;
  sub: MySubscription | undefined;
  can: (permission: string) => boolean;
  has: (feature: FeatureKey) => boolean;
  logout: () => Promise<void>;
};
const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession must be used inside the portal');
  return s;
}

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        refetchOnWindowFocus: true,
        retry: (n, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && n < 2,
      },
    },
  });
}

export function PortalProviders({ children }: { children: ReactNode }) {
  const [client] = useState(makeClient);
  return <QueryClientProvider client={client}><SessionGate>{children}</SessionGate></QueryClientProvider>;
}

const noSubscribe = () => () => undefined;

function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const qc = useQueryClient();
  // Tokens live in browser storage: unknown (null) while rendering on the server
  const hasToken = useSyncExternalStore(noSubscribe, () => !!tokens.access() || !!tokens.refresh(), () => null);

  const me = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: hasToken === true, staleTime: 5 * 60_000 });
  const sub = useQuery({ queryKey: ['subscription'], queryFn: mySubscription, enabled: !!me.data && !me.data.isPlatformAdmin, staleTime: 60_000 });

  const toLogin = useCallback(() => {
    qc.clear();
    router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [qc, router, path]);

  useEffect(() => { setSessionEndedHandler(toLogin); }, [toLogin]);
  useEffect(() => { if (hasToken === false) toLogin(); }, [hasToken, toLogin]);
  // First login with a temporary password: change it before anything else
  useEffect(() => {
    if (me.data?.mustChangePassword && path !== '/app/settings') router.replace('/app/settings?first=1');
  }, [me.data, path, router]);

  const logout = useCallback(async () => {
    await apiLogout();
    qc.clear();
    router.replace('/login');
  }, [qc, router]);

  const value = useMemo<Session | null>(() => {
    if (!me.data) return null;
    const m = me.data;
    return {
      me: m, sub: sub.data, logout,
      can: (p) => m.permissions.includes(p),
      // Until the plan is loaded nothing is hidden; the server answers with a clear message if needed
      has: (f) => !sub.data || sub.data.features.includes(f),
    };
  }, [me.data, sub.data, logout]);

  if (me.error) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper p-6 text-center">
        <div>
          <p className="font-display text-[22px] font-semibold text-ink">Could not load your account</p>
          <p className="mt-2 text-muted">{me.error instanceof Error ? me.error.message : 'Try again in a moment.'}</p>
          <button type="button" onClick={() => void me.refetch()} className="mt-5 rounded-full bg-blue px-5 py-2.5 font-semibold text-white">Try again</button>
        </div>
      </div>
    );
  }
  if (!value) {
    return <div className="grid min-h-screen place-items-center bg-paper" role="status" aria-label="Loading your workspace"><span className="h-8 w-8 animate-spin rounded-full border-[3px] border-blue border-t-transparent" /></div>;
  }
  if (value.me.isPlatformAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper p-6 text-center">
        <div className="max-w-[46ch]">
          <p className="font-display text-[22px] font-semibold text-ink">This is a platform admin account</p>
          <p className="mt-2 text-muted">The advisor workspace is for advisors and their staff. Use the admin panel to approve advisors and manage products.</p>
          <button type="button" onClick={() => void logout()} className="mt-5 rounded-full bg-blue px-5 py-2.5 font-semibold text-white">Log out</button>
        </div>
      </div>
    );
  }
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
