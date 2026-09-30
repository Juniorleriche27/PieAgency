"use client";

import { useEffect, useState } from "react";
import {
  ensureActiveSession,
  onAuthSessionChange,
  type AuthSession,
} from "@/lib/auth";

export function useAuthSession(apiBaseUrl: string) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncSession() {
      const nextSession = await ensureActiveSession(apiBaseUrl);
      if (!active) {
        return;
      }

      setSession(nextSession);
      setIsReady(true);
    }

    void syncSession();
    // Session state rarely changes minute-to-minute. A five-minute safety sync,
    // plus focus/auth-change events, keeps the UI current without repeatedly
    // hitting the backend/Supabase while a tab remains idle.
    const intervalId = window.setInterval(() => {
      void syncSession();
    }, 5 * 60_000);
    const handleFocus = () => {
      void syncSession();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncSession();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const cleanup = onAuthSessionChange(() => {
      void syncSession();
    });

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cleanup();
    };
  }, [apiBaseUrl]);

  return { session, isReady };
}
