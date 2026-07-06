export type PlatformRole = "student" | "admin";

export type AuthUserProfile = {
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  country?: string | null;
  role: PlatformRole;
  is_active: boolean;
  onboarding_status?: "not_started" | "in_progress" | "submitted" | "under_review" | "validated" | "rejected" | null;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number | null;
  token_type: string;
  user: AuthUserProfile;
};

export type AuthSignUpResponse = {
  status: "ok" | "pending_confirmation";
  message: string;
  session?: AuthSession | null;
  user?: AuthUserProfile | null;
};

const AUTH_STORAGE_KEY = "pieagency.auth.session";
const AUTH_EVENT_NAME = "pieagency-auth-changed";
const AUTH_REFRESH_SKEW_SECONDS = 5 * 60;
const AUTH_REFRESH_GRACE_SECONDS = 24 * 60 * 60;

let refreshInFlight: Promise<AuthSession | null> | null = null;

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";
}

export function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as AuthSession;
    if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function isSessionExpired(session: AuthSession, graceSeconds = 0) {
  if (!session.expires_at) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return session.expires_at + graceSeconds <= now;
}

function shouldRefreshSession(session: AuthSession) {
  if (!session.expires_at) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return session.expires_at - AUTH_REFRESH_SKEW_SECONDS <= now;
}

function dispatchAuthChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function saveStoredSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  dispatchAuthChange();
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  dispatchAuthChange();
}

export function onAuthSessionChange(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(AUTH_EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

async function performSessionRefresh(
  apiBaseUrl: string,
  currentSession: AuthSession,
): Promise<AuthSession | null> {
  const attemptedRefreshToken = currentSession.refresh_token;

  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: attemptedRefreshToken,
      }),
    });

    if (!response.ok) {
      const latestSession = readStoredSession();
      if (latestSession?.refresh_token && latestSession.refresh_token !== attemptedRefreshToken) {
        return latestSession;
      }

      if ([400, 401, 403].includes(response.status)) {
        clearStoredSession();
        return null;
      }

      return isSessionExpired(currentSession, AUTH_REFRESH_GRACE_SECONDS) ? null : currentSession;
    }

    const payload = (await response.json()) as AuthSession;
    saveStoredSession(payload);
    return payload;
  } catch {
    return isSessionExpired(currentSession, AUTH_REFRESH_GRACE_SECONDS) ? null : currentSession;
  }
}

export async function refreshStoredSession(
  apiBaseUrl = getApiBaseUrl(),
): Promise<AuthSession | null> {
  const currentSession = readStoredSession();
  if (!currentSession?.refresh_token) {
    clearStoredSession();
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = performSessionRefresh(apiBaseUrl, currentSession).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function ensureActiveSession(
  apiBaseUrl = getApiBaseUrl(),
): Promise<AuthSession | null> {
  const currentSession = readStoredSession();
  if (!currentSession) {
    return null;
  }

  if (!shouldRefreshSession(currentSession)) {
    return currentSession;
  }

  return refreshStoredSession(apiBaseUrl);
}

export async function authenticatedFetch(
  path: string,
  init?: RequestInit,
  options?: { apiBaseUrl?: string; requireAuth?: boolean },
) {
  const apiBaseUrl = options?.apiBaseUrl ?? getApiBaseUrl();
  const requireAuth = options?.requireAuth ?? false;
  const session = await ensureActiveSession(apiBaseUrl);

  if (requireAuth && !session) {
    throw new Error("AUTH_REQUIRED");
  }

  const headers = new Headers(init?.headers);
  if (session) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status !== 401 || !session?.refresh_token) {
    return response;
  }

  const refreshedSession = await refreshStoredSession(apiBaseUrl);
  if (!refreshedSession?.access_token || refreshedSession.access_token === session.access_token) {
    return response;
  }

  const retryHeaders = new Headers(init?.headers);
  retryHeaders.set("Authorization", `Bearer ${refreshedSession.access_token}`);
  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: retryHeaders,
  });
}
