"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuthSession } from "@/hooks/use-auth-session";
import { getApiBaseUrl } from "@/lib/auth";

function SSOAuthorizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { session, isReady } = useAuthSession(apiBaseUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;

    const clientId = searchParams.get("client_id") ?? "";
    const redirectUri = searchParams.get("redirect_uri") ?? "";
    const state = searchParams.get("state") ?? "";

    if (!clientId || !redirectUri || !state) {
      setError("Demande SSO invalide.");
      return;
    }

    if (!session) {
      const next = `/sso/authorize?${searchParams.toString()}`;
      router.replace(`/connexion?next=${encodeURIComponent(next)}`);
      return;
    }

    let cancelled = false;
    fetch(`${apiBaseUrl}/api/auth/sso/authorize`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.detail || "Impossible d'autoriser Assistant.");
        }
        return response.json() as Promise<{ code: string }>;
      })
      .then(({ code }) => {
        if (cancelled) return;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = redirectUri;
        form.style.display = "none";

        for (const [name, value] of [["code", code], ["state", state]]) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Erreur SSO.");
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, isReady, router, searchParams, session]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">Identité PieAgency</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Connexion à Assistant
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {error ?? "Validation de votre session et ouverture sécurisée d’Assistant…"}
        </p>
      </div>
    </main>
  );
}

export default function SSOAuthorizePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600">Préparation de la connexion sécurisée…</p>
          </div>
        </main>
      }
    >
      <SSOAuthorizeContent />
    </Suspense>
  );
}
