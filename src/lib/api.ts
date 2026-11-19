import type { AuthSession, AuthUser } from '../types/auth';
import {
  clearStoredSession,
  getStoredSession,
  storeSession,
} from './sessionStorage';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getApiBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!baseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is missing. Configure the Munolink backend URL for this app build.'
    );
  }
  return baseUrl.replace(/\/+$/, '');
}

export function backendUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  retryAfterRefresh?: boolean;
};

async function rawRequest<T>(
  path: string,
  options: RequestOptions,
  accessToken?: string
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  const responseText = await response.text();
  let result: { error?: string; details?: unknown } | T | null = null;
  if (responseText) {
    try {
      result = JSON.parse(responseText) as
        | { error?: string; details?: unknown }
        | T;
    } catch {
      throw new ApiError('Backend returned an invalid response.', 502);
    }
  }
  if (!response.ok) {
    const errorResult = result as { error?: string; details?: unknown } | null;
    throw new ApiError(
      errorResult?.error || `Backend request failed (${response.status}).`,
      response.status,
      errorResult?.details
    );
  }
  return result as T;
}

async function refreshStoredSession(): Promise<AuthSession> {
  const current = await getStoredSession();
  if (!current?.refresh_token) {
    throw new ApiError('Your sign-in session has expired.', 401);
  }

  try {
    const refreshed = await rawRequest<{ session: AuthSession | null }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: { refreshToken: current.refresh_token },
        auth: false,
      }
    );
    if (!refreshed.session) {
      throw new ApiError(
        'The backend did not return a refreshed session.',
        502
      );
    }
    await storeSession(refreshed.session);
    return refreshed.session;
  } catch (error) {
    await clearStoredSession();
    throw error;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const shouldAuthenticate = options.auth !== false;
  const session = shouldAuthenticate ? await getStoredSession() : null;

  try {
    return await rawRequest<T>(path, options, session?.access_token);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !session?.refresh_token ||
      options.retryAfterRefresh === false ||
      path === '/auth/refresh'
    ) {
      throw error;
    }

    const refreshed = await refreshStoredSession();
    return rawRequest<T>(path, options, refreshed.access_token);
  }
}

export type AuthResult = {
  user: AuthUser | null;
  session: AuthSession | null;
};

async function authRequest(
  path: string,
  body?: unknown,
  method: 'POST' | 'PUT' = 'POST'
): Promise<AuthResult> {
  const result = await apiRequest<AuthResult>(path, {
    method,
    body,
    auth:
      path === '/auth/me' ||
      path === '/auth/password' ||
      path === '/auth/sign-out',
  });
  if (result.session) await storeSession(result.session);
  return result;
}

export const authApi = {
  signUp: (input: {
    email?: string;
    phone?: string;
    password: string;
    fullName?: string;
  }) => authRequest('/auth/signup', input),

  signIn: (input: { email?: string; phone?: string; password: string }) =>
    authRequest('/auth/login', input),

  requestOtp: (input: {
    email?: string;
    phone?: string;
    shouldCreateUser?: boolean;
  }) => authRequest('/auth/otp', input),

  verifyOtp: (input: {
    email?: string;
    phone?: string;
    token: string;
    type: 'signup' | 'sms' | 'recovery';
  }) => authRequest('/auth/verify-otp', input),

  requestPasswordReset: (email: string) =>
    apiRequest<void>('/auth/password-reset', {
      method: 'POST',
      body: { email },
      auth: false,
    }),

  requestPhonePasswordReset: (phone: string) =>
    apiRequest<void>('/auth/password-reset/phone', {
      method: 'POST',
      body: { phone },
      auth: false,
    }),

  updatePassword: (password: string) =>
    authRequest('/auth/password', { password }, 'PUT'),

  googleUrl: async (redirectTo: string) => {
    const result = await apiRequest<{ url: string }>('/auth/google/url', {
      method: 'POST',
      body: { redirectTo },
      auth: false,
    });
    return result.url;
  },

  signInWithGoogleToken: (idToken: string, nonce?: string) =>
    authRequest('/auth/google/token', { idToken, nonce }),

  adoptSession: (accessToken: string, refreshToken: string) =>
    authRequest('/auth/session', { accessToken, refreshToken }),

  me: () => apiRequest<{ user: AuthUser }>('/auth/me'),

  signOut: async () => {
    try {
      await apiRequest<void>('/auth/sign-out', { method: 'POST' });
    } finally {
      await clearStoredSession();
    }
  },
};

export async function uploadBinary<T>(
  path: string,
  file: Blob,
  contentType: string,
  upsert: boolean
): Promise<T> {
  const session = await getStoredSession();
  const send = async (accessToken?: string) => {
    const response = await fetch(backendUrl(path), {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-upsert': String(upsert),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: file,
    });
    const text = await response.text();
    let result: unknown = null;
    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        throw new ApiError('Backend returned an invalid response.', 502);
      }
    }
    if (!response.ok) {
      const errorResult = result as { error?: string; details?: unknown } | null;
      throw new ApiError(
        errorResult?.error || `Backend request failed (${response.status}).`,
        response.status,
        errorResult?.details
      );
    }
    return result as T;
  };

  try {
    return await send(session?.access_token);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !session?.refresh_token
    ) {
      throw error;
    }
    const refreshed = await refreshStoredSession();
    return send(refreshed.access_token);
  }
}
