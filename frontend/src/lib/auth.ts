export type PlatformRole = "student" | "admin";

export type AuthUserProfile = {
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  country?: string | null;
  role: PlatformRole;
  is_active: boolean;
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
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
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

export async function refreshStoredSession(
  apiBaseUrl = getApiBaseUrl(),
): Promise<AuthSession | null> {
  const currentSession = readStoredSession();
  if (!currentSession?.refresh_token) {
    clearStoredSession();
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: currentSession.refresh_token,
    }),
  });

  if (!response.ok) {
    clearStoredSession();
    return null;
  }

  const payload = (await response.json()) as AuthSession;
  saveStoredSession(payload);
  return payload;
}

export async function ensureActiveSession(
  apiBaseUrl = getApiBaseUrl(),
): Promise<AuthSession | null> {
  const currentSession = readStoredSession();
  if (!currentSession) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (currentSession.expires_at && currentSession.expires_at - 60 > now) {
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

  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });
}
