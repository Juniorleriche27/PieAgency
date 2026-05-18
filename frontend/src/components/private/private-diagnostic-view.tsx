"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { CopilotBanner } from "@/components/private/copilot-banner";

// ─── Static data (no backend change needed) ────────────────────────────────

type ReadinessLevel = "Faible" | "En cours" | "Bon" | "Prêt à vérifier";

type DiagnosticData = {
  readiness: ReadinessLevel;
  readinessPercent: number;
  strengths: string[];
  watchpoints: string[];
  priorities: string[];
};

const STATIC_DIAGNOSTIC: DiagnosticData = {
  readiness: "En cours",
  readinessPercent: 42,
  strengths: [
    "Parcours académique renseigné",
    "Objectif d'études identifié",
    "Ressources consultables disponibles",
    "Étape actuelle connue dans votre parcours",
  ],
  watchpoints: [
    "Projet d'études à clarifier",
    "Projet professionnel incomplet",
    "Documents non encore vérifiés",
    "Choix de formations à confirmer",
    "Préparation entretien non commencée",
  ],
  priorities: [
    "Clarifier votre projet d'études",
    "Définir le métier ou secteur visé",
    "Préparer vos lettres de motivation",
    "Vérifier vos documents avant le dépôt officiel",
  ],
};

const READINESS_COLOR: Record<ReadinessLevel, string> = {
  "Faible":          "#ef4444",
  "En cours":        "#f59e0b",
  "Bon":             "#3b82f6",
  "Prêt à vérifier": "#10b981",
};

// ─── View ─────────────────────────────────────────────────────────────────────

export function PrivateDiagnosticView() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const d = STATIC_DIAGNOSTIC;
  const color = READINESS_COLOR[d.readiness];

  return (
    <div className="diag-page">
      <CopilotBanner />

      {/* Header */}
      <header className="diag-header">
        <div className="diag-header-icon">
          <ClipboardList size={28} />
        </div>
        <div>
          <h1 className="diag-title">Diagnostic de votre dossier</h1>
          <p className="diag-subtitle">
            Identifiez vos forces, vos points de vigilance et les prochaines actions
            utiles pour avancer dans votre procédure.
          </p>
        </div>
      </header>

      {/* Niveau de préparation */}
      <section className="diag-card diag-readiness">
        <div className="diag-card-head">
          <Target size={18} />
          <h2>Niveau de préparation</h2>
        </div>
        <div className="diag-readiness-label" style={{ color }}>
          {d.readiness}
        </div>
        <div className="diag-bar-track">
          <div
            className="diag-bar-fill"
            style={{
              width: mounted ? `${d.readinessPercent}%` : "0%",
              background: color,
            }}
          />
        </div>
        <p className="diag-readiness-hint">
          Votre dossier est en cours de construction. Suivez les priorités ci-dessous pour progresser.
        </p>
      </section>

      <div className="diag-grid">
        {/* Forces */}
        <section className="diag-card">
          <div className="diag-card-head diag-card-head--green">
            <ShieldCheck size={18} />
            <h2>Forces du dossier</h2>
          </div>
          <ul className="diag-list diag-list--strengths">
            {d.strengths.map((s) => (
              <li key={s}>
                <CheckCircle2 size={15} />
                {s}
              </li>
            ))}
          </ul>
        </section>

        {/* Points de vigilance */}
        <section className="diag-card">
          <div className="diag-card-head diag-card-head--amber">
            <AlertTriangle size={18} />
            <h2>Points de vigilance</h2>
          </div>
          <ul className="diag-list diag-list--watchpoints">
            {d.watchpoints.map((w) => (
              <li key={w}>
                <AlertTriangle size={14} />
                {w}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Priorités */}
      <section className="diag-card diag-priorities">
        <div className="diag-card-head">
          <Sparkles size={18} />
          <h2>Priorités recommandées</h2>
        </div>
        <ol className="diag-priorities-list">
          {d.priorities.map((p, i) => (
            <li key={p}>
              <span className="diag-priority-num">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        <p className="diag-disclaimer">
          Ce diagnostic aide à préparer et organiser votre dossier. Il ne constitue pas une décision officielle.
        </p>
      </section>

      {/* Actions */}
      <section className="diag-actions">
        <Link className="btn btn-primary" href="/espace-etudiant/parcours-guide">
          Continuer dans Mon parcours guidé
          <ArrowRight size={16} />
        </Link>
        <Link className="btn btn-outline" href="/espace-etudiant/assistant?from=parcours-guide&step=open-assistant">
          Poser une question à l&apos;assistant dossier
        </Link>
        <Link className="btn btn-outline" href="/espace-etudiant/ressources?from=parcours-guide&step=visit-resources">
          Voir les ressources recommandées
        </Link>
        <Link className="btn btn-outline" href="/espace-etudiant/produits?from=parcours-guide&step=visit-products">
          Voir les produits utiles
        </Link>
      </section>
    </div>
  );
}
