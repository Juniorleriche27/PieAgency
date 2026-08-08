"use client";

import { AlertTriangle, LoaderCircle, RefreshCw, WifiOff } from "lucide-react";

export type CommunityLoadState = "loading" | "ready" | "empty" | "error";

type CommunityStatusProps = {
  state: CommunityLoadState;
  onRetry: () => void;
};

export function CommunityStatus({ state, onRetry }: CommunityStatusProps) {
  if (state === "ready") return null;

  if (state === "loading") {
    return (
      <section className="social-system-state is-loading" role="status" aria-live="polite">
        <LoaderCircle className="social-system-state-spinner" size={22} aria-hidden="true" />
        <div>
          <strong>Connexion à PieHUB…</strong>
          <p>Nous récupérons les dernières publications de la communauté.</p>
        </div>
      </section>
    );
  }

  if (state === "empty") {
    return (
      <section className="social-system-state is-empty" role="status">
        <AlertTriangle size={22} aria-hidden="true" />
        <div>
          <strong>La communauté est prête</strong>
          <p>Aucune publication n’est encore disponible. Soyez la première personne à partager une information.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="social-system-state is-error" role="alert">
      <WifiOff size={22} aria-hidden="true" />
      <div>
        <strong>PieHUB est momentanément indisponible</strong>
        <p>Nous n’affichons pas de fausses publications. Vérifiez votre connexion puis réessayez.</p>
      </div>
      <button className="social-system-retry" onClick={onRetry} type="button">
        <RefreshCw size={16} aria-hidden="true" /> Réessayer
      </button>
    </section>
  );
}

export type CommunityToast = { id: number; text: string };

export function CommunityToastRegion({ toasts }: { toasts: CommunityToast[] }) {
  if (!toasts.length) return null;

  return (
    <div className="social-toast-stack" role="status" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className="social-toast" key={toast.id}>{toast.text}</div>
      ))}
    </div>
  );
}
