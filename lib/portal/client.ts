// API client for the advisor portal.
// - Adds the access token to every call
// - On 401 it refreshes the session once (calls that fail together share one refresh) and repeats the call
// - Every error becomes ApiError with the server's readable message and field details
import { API_URL } from '@/lib/site';

const ACCESS = 'ia.accessToken';
const REFRESH = 'ia.refreshToken';
const REMEMBER = 'ia.remember';

export type FieldIssue = { path?: string; message?: string };
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly details: FieldIssue[] = []) {
    super(message);
  }
}

// "Keep me signed in" keeps the refresh token in localStorage; otherwise it is dropped when the tab closes
const store = () => (typeof window !== 'undefined' && localStorage.getItem(REMEMBER) === '1' ? localStorage : sessionStorage);

export const tokens = {
  access: () => (typeof window === 'undefined' ? null : store().getItem(ACCESS)),
  refresh: () => (typeof window === 'undefined' ? null : store().getItem(REFRESH)),
  set(access: string, refresh: string, remember?: boolean) {
    if (remember !== undefined) {
      tokens.clear();
      if (remember) localStorage.setItem(REMEMBER, '1');
    }
    store().setItem(ACCESS, access);
    store().setItem(REFRESH, refresh);
  },
  clear() {
    for (const s of [localStorage, sessionStorage]) { s.removeItem(ACCESS); s.removeItem(REFRESH); }
    localStorage.removeItem(REMEMBER);
  },
};

let onSessionEnded: () => void = () => undefined;
export const setSessionEndedHandler = (fn: () => void) => { onSessionEnded = fn; };

type Query = Record<string, string | number | boolean | undefined | null>;
export type RequestOptions = { method?: string; body?: unknown; query?: Query; form?: FormData; auth?: boolean; signal?: AbortSignal };

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const access = tokens.access();
  if (opts.auth !== false && access) headers.Authorization = `Bearer ${access}`;
  try {
    return await fetch(url, {
      method: opts.method ?? 'GET', headers, signal: opts.signal,
      body: opts.form ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your internet connection.');
  }
}

let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = tokens.refresh();
    if (!refreshToken) return false;
    const res = await send('/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false });
    if (!res.ok) return false;
    const body = (await res.json()) as { accessToken: string; refreshToken: string };
    tokens.set(body.accessToken, body.refreshToken);
    return true;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

async function errorOf(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as { code?: string; message?: string; details?: FieldIssue[] } | null;
  return new ApiError(res.status, body?.code ?? 'ERROR', body?.message ?? `Request failed (${res.status})`, body?.details ?? []);
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await send(path, opts);
  if (res.status === 401 && opts.auth !== false) {
    if (await refreshSession()) res = await send(path, opts);
    if (res.status === 401) {
      tokens.clear();
      onSessionEnded();
      throw new ApiError(401, 'UNAUTHORIZED', 'Your session has ended. Please log in again.');
    }
  }
  if (!res.ok) throw await errorOf(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const errorText = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');
