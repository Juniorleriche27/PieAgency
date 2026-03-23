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
    const cleanup = onAuthSessionChange(() => {
      void syncSession();
    });

    return () => {
      active = false;
      cleanup();
    };
  }, [apiBaseUrl]);

  return { session, isReady };
}
