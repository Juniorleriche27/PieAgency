"use client";

import Link from "next/link";
import { ArrowLeft, CheckCheck, Map } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const STEP_LABELS: Record<string, string> = {
  "read-diagnostic":      "Lire mon diagnostic",
  "prepare-documents":    "Préparer mes documents",
  "prepare-study-project":"Préparer mon projet d'études",
  "visit-resources":      "Consulter les ressources",
  "visit-products":       "Voir les produits utiles",
  "open-assistant":       "Poser une question à l'assistant",
  "visit-onboarding":     "Compléter mon embarquement",
  "visit-subscription":   "Gérer mon abonnement",
};

function BannerInner({ onMarkDone }: { onMarkDone?: () => void }) {
  const params = useSearchParams();
  const from  = params.get("from");
  const step  = params.get("step");

  if (from !== "parcours-guide") return null;

  const stepLabel = step ? (STEP_LABELS[step] ?? step.replace(/-/g, " ")) : null;

  return (
    <div className="copilot-banner">
      <div className="copilot-banner-left">
        <Map size={16} className="copilot-banner-icon" />
        <div>
          <span className="copilot-banner-title">Vous êtes ici depuis votre parcours guidé</span>
          {stepLabel && (
            <span className="copilot-banner-step">Étape liée : {stepLabel}</span>
          )}
        </div>
      </div>
      <div className="copilot-banner-actions">
        {onMarkDone && (
          <button className="copilot-banner-btn copilot-banner-btn--done" onClick={onMarkDone} type="button">
            <CheckCheck size={14} />
            Marquer comme fait
          </button>
        )}
        <Link className="copilot-banner-btn copilot-banner-btn--back" href="/espace-etudiant/parcours-guide">
          <ArrowLeft size={14} />
          Retour au parcours guidé
        </Link>
      </div>
    </div>
  );
}

export function CopilotBanner({ onMarkDone }: { onMarkDone?: () => void }) {
  return (
    <Suspense fallback={null}>
      <BannerInner onMarkDone={onMarkDone} />
    </Suspense>
  );
}
