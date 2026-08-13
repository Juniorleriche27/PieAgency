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
  user: AuthUserProfile;
};

export type AuthSignUpResponse = {
  status: "ok" | "pending_confirmation";
  message: string;
  authenticated: boolean;
  user?: AuthUserProfile | null;
};

const AUTH_EVENT_NAME = "pieagency-auth-changed";
let memorySession: AuthSession | null = null;
let sessionRequestInFlight: Promise<AuthSession | null> | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";
}

function dispatchAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  }
}

export function readStoredSession(): AuthSession | null {
  return memorySession;
}

export function saveStoredSession(session: AuthSession) {
  memorySession = session;
  dispatchAuthChange();
}

export function clearStoredSession() {
  memorySession = null;
  dispatchAuthChange();
}

export function onAuthSessionChange(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => callback();
  window.addEventListener(AUTH_EVENT_NAME, handler);
  return () => window.removeEventListener(AUTH_EVENT_NAME, handler);
}

async function refreshWebSession(apiBaseUrl: string): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${apiBaseUrl}/api/auth/web/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          clearStoredSession();
          return false;
        }
        const user = (await response.json()) as AuthUserProfile;
        saveStoredSession({ user });
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function requestCurrentSession(apiBaseUrl: string): Promise<AuthSession | null> {
  try {
    let response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      credentials: "include",
    });

    if (response.status === 401 && (await refreshWebSession(apiBaseUrl))) {
      response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        credentials: "include",
      });
    }

    if (!response.ok) {
      clearStoredSession();
      return null;
    }

    const user = (await response.json()) as AuthUserProfile;
    const session = { user };
    memorySession = session;
    return session;
  } catch {
    return memorySession;
  }
}

export async function ensureActiveSession(
  apiBaseUrl = getApiBaseUrl(),
): Promise<AuthSession | null> {
  if (!sessionRequestInFlight) {
    sessionRequestInFlight = requestCurrentSession(apiBaseUrl).finally(() => {
      sessionRequestInFlight = null;
    });
  }
  return sessionRequestInFlight;
}

export async function signOutWebSession(apiBaseUrl = getApiBaseUrl()) {
  try {
    await fetch(`${apiBaseUrl}/api/auth/web/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearStoredSession();
  }
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

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
  });

  if (response.status !== 401 || !session) {
    return response;
  }

  const refreshed = await refreshWebSession(apiBaseUrl);
  if (!refreshed) {
    return response;
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
  });
}
