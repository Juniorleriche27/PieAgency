const DEFAULT_PRODUCTION_ASSISTANT_ORIGIN = "https://assistant.pieagency.fr";

export function getAssistantOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "pieagency.fr" || hostname.endsWith(".pieagency.fr")) {
    return DEFAULT_PRODUCTION_ASSISTANT_ORIGIN;
  }
  return null;
}

export async function revokeAssistantSession(): Promise<void> {
  const origin = getAssistantOrigin();
  if (!origin) return;

  try {
    await fetch(`${origin}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Best effort only: PieAgency logout must never depend on Assistant availability.
  }
}
