'use server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
console.log("API URL",API_BASE)
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
    return { success: false, message: (e as Error).message || 'Network error' };
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
