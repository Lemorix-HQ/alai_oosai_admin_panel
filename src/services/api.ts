'use server';
import { cookies } from 'next/headers';

/**
 * Where the API lives, as seen from THIS PROCESS.
 *
 * Every call in this file runs on the server — the module is 'use server' and
 * reads cookies() — so the address that matters is the one the Next server can
 * reach, not the one the browser can. Under Docker those differ: the browser
 * talks to the published http://localhost:3000, while inside the admin
 * container `localhost` is the admin container itself and the API is at
 * http://api:3000.
 *
 * API_URL is therefore read first, at runtime. NEXT_PUBLIC_API_URL is kept as
 * the fallback for local development, where the two addresses happen to be the
 * same — but it is the wrong tool for this job: the NEXT_PUBLIC_ prefix means
 * it is inlined at BUILD time, so it cannot describe a network the image is
 * later run on.
 */
const API_BASE =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

async function request<TPayload, TResponse>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  data?: TPayload,
  tags?: string[]
): Promise<ApiResponse<TResponse>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  const isFormData = data instanceof FormData;
  const reqHeaders: Record<string, string> = {};
  if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
  if (!isFormData) reqHeaders['Content-Type'] = 'application/json';

  const url =
    method === 'GET' && data && !isFormData
      ? `${API_BASE}${endpoint}?${new URLSearchParams(data as Record<string, string>).toString()}`
      : `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      ...(data && method !== 'GET'
        ? { body: isFormData ? (data as FormData) : JSON.stringify(data) }
        : {}),
      ...(tags ? { next: { tags } } : { cache: 'no-store' }),
    });

    const raw = (await res.json()) as Record<string, unknown>;

    // The backend's ResponseTransformInterceptor wraps all success responses
    // as { response: <actual_data> }. Error responses from exception filters
    // are NOT wrapped and come as { statusCode, message, error, ... }.
    if ('response' in raw && raw.response !== null && typeof raw.response === 'object') {
      return raw.response as ApiResponse<TResponse>;
    }

    // Error response from exception filter: { statusCode, message, error, path, timestamp }
    // Map to ApiResponse so callers can use res.success / res.message uniformly.
    if ('statusCode' in raw) {
      return {
        success: false,
        message: typeof raw.message === 'string' ? raw.message : 'Request failed',
      } as ApiResponse<TResponse>;
    }

    return raw as ApiResponse<TResponse>;
  } catch (e: unknown) {
    // undici says only "fetch failed" when it cannot connect, which tells the
    // user nothing about which address failed — and the browser never sees this
    // request at all, so its network tab cannot tell them either.
    const detail = (e as Error).message || 'Network error';
    const unreachable = /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|timeout/i.test(detail);
    return {
      success: false,
      message: unreachable
        ? `Cannot reach the API at ${API_BASE} (${detail}). Check that it is running and that this address is correct from inside this process.`
        : detail,
    };
  }
}

export async function getRequest<P, R>(
  endpoint: string,
  params?: P,
  tags?: string[]
): Promise<ApiResponse<R>> {
  return request<P, R>(endpoint, 'GET', params, tags);
}

export async function postRequest<P, R>(
  endpoint: string,
  data?: P
): Promise<ApiResponse<R>> {
  return request<P, R>(endpoint, 'POST', data);
}

export async function patchRequest<P, R>(
  endpoint: string,
  data?: P
): Promise<ApiResponse<R>> {
  return request<P, R>(endpoint, 'PATCH', data);
}

export async function deleteRequest<R>(endpoint: string): Promise<ApiResponse<R>> {
  return request<undefined, R>(endpoint, 'DELETE');
}
