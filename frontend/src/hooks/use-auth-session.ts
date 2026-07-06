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
    const intervalId = window.setInterval(() => {
      void syncSession();
    }, 60_000);
    const handleFocus = () => {
      void syncSession();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    const cleanup = onAuthSessionChange(() => {
      void syncSession();
    });

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      cleanup();
    };
  }, [apiBaseUrl]);

  return { session, isReady };
}
