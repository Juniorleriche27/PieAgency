"use client";

import Link from "next/link";
import { ArrowLeft, CheckCheck, Map } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { completeStep } from "@/lib/progressive-path";

const STEP_LABELS: Record<string, string> = {
  "understand-profile":              "Comprendre mon profil",
  "read-diagnostic":                 "Lire mon diagnostic",
  "define-procedure-strategy":       "Définir ma stratégie",
  "choose-formations":               "Choisir mes formations",
  "prepare-documents":               "Préparer mes documents",
  "prepare-cv":                      "Préparer mon CV",
  "prepare-study-project":           "Préparer mon projet d'études",
  "prepare-career-project":          "Définir mon projet professionnel",
  "prepare-motivation-letters":      "Rédiger mes lettres de motivation",
  "verify-before-official-deposit":  "Vérifier avant le dépôt officiel",
  "declare-official-deposit":        "Déclarer le dépôt officiel",
  "prepare-campus-france-interview": "Préparer l'entretien Campus France",
  "follow-admission":                "Suivre mon admission",
  "prepare-visa-file":               "Préparer mon dossier visa",
  "declare-visa-deposit":            "Déclarer le dépôt visa",
  "follow-visa":                     "Suivre mon visa",
  "prepare-departure":               "Préparer mon départ",
  // legacy step keys from URL params
  "visit-resources":    "Consulter les ressources",
  "visit-products":     "Voir les produits utiles",
  "open-assistant":     "Poser une question à l'assistant",
  "visit-onboarding":   "Compléter mon embarquement",
  "visit-subscription": "Gérer mon abonnement",
  "prepare-documents-step": "Préparer mes documents",
};

function BannerInner() {
  const params   = useSearchParams();
  const router   = useRouter();
  const from     = params.get("from");
  const stepId   = params.get("step");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  if (from !== "parcours-guide") return null;

  const stepLabel = stepId ? (STEP_LABELS[stepId] ?? stepId.replace(/-/g, " ")) : null;

  // Only show "J'ai terminé" if step is a real step_id (not a generic param like "visit-resources")
  const isActionableStep = stepId ? !["visit-resources","visit-products","open-assistant","visit-onboarding","visit-subscription"].includes(stepId) : false;

  async function handleComplete() {
    if (!stepId || loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await completeStep(stepId);
      if (!result) {
        setError("Cette étape ne peut pas être terminée depuis cette page. Revenez au parcours guidé pour vérifier l’étape active.");
        return;
      }
      setDone(true);
      router.push("/espace-etudiant/parcours-guide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="copilot-banner">
      <div className="copilot-banner-left">
        <Map size={16} className="copilot-banner-icon" />
        <div>
          <span className="copilot-banner-title">Vous êtes ici depuis votre parcours guidé</span>
          {stepLabel && (
            <span className="copilot-banner-step">Étape liée : {stepLabel}</span>
          )}
          {error && (
            <span className="copilot-banner-step" role="alert">{error}</span>
          )}
        </div>
      </div>
      <div className="copilot-banner-actions">
        {isActionableStep && !done ? (
          <button
            className="copilot-banner-btn copilot-banner-btn--done"
            disabled={loading}
            onClick={() => void handleComplete()}
            type="button"
          >
            <CheckCheck size={14} />
            {loading ? "Enregistrement…" : "J'ai terminé cette étape"}
          </button>
        ) : null}
        <Link className="copilot-banner-btn copilot-banner-btn--back" href="/espace-etudiant/parcours-guide">
          <ArrowLeft size={14} />
          Retour au parcours guidé
        </Link>
      </div>
    </div>
  );
}

export function CopilotBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  );
}
