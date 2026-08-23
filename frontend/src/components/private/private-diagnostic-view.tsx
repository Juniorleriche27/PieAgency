"use client";
import { AssistantGenieTrigger } from "@/components/private/assistant-genie-trigger";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { CopilotBanner } from "@/components/private/copilot-banner";
import { getPrivateDiagnostic, type PrivateDiagnosticResult } from "@/lib/private-diagnostic";
import {
  fetchProgressivePath,
  updateStepEvidence,
  type ProgressivePath,
} from "@/lib/progressive-path";

export function PrivateDiagnosticView() {
  const [diagnostic, setDiagnostic] = useState<PrivateDiagnosticResult | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [path, setPath] = useState<ProgressivePath | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getPrivateDiagnostic(), fetchProgressivePath()])
      .then(([result, pathResult]) => {
        if (!active) return;
        setDiagnostic(result);
        setPath(pathResult);
      })
      .catch(() => { if (active) setError("Impossible de charger votre diagnostic réel."); });
    return () => { active = false; };
  }, [retryKey]);


  const diagnosticStep = path?.steps.find((step) => step.id === "read-diagnostic") ?? null;
  const canConfirmDiagnostic = Boolean(
    diagnosticStep?.is_current &&
    diagnosticStep.requirements.some(
      (requirement) => requirement.key === "diagnostic_available" && requirement.satisfied,
    ),
  );
  const diagnosticReviewed = Boolean(
    diagnosticStep?.requirements.some(
      (requirement) => requirement.key === "diagnostic_reviewed" && requirement.satisfied,
    ),
  );

  async function confirmDiagnosticReviewed() {
    if (!diagnosticStep || savingReview) return;
    setSavingReview(true);
    setReviewError("");
    try {
      const updated = await updateStepEvidence(diagnosticStep.id, ["diagnostic_reviewed"]);
      setPath(updated);
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Impossible d'enregistrer cette validation.",
      );
    } finally {
      setSavingReview(false);
    }
  }

  return (
    <div className="diag-page">
      <CopilotBanner />
      <header className="diag-header">
        <div className="diag-header-icon"><ClipboardList size={28} /></div>
        <div><h1 className="diag-title">Diagnostic de votre dossier</h1><p className="diag-subtitle">Des recommandations calculées à partir des informations enregistrées dans votre dossier.</p></div>
      </header>

      {error ? <div className="portal-warning" role="alert">{error} <button className="btn btn-outline" onClick={() => { setError(""); setDiagnostic(null); setRetryKey((value) => value + 1); }} type="button">Réessayer</button></div> : null}
      {!diagnostic && !error ? <div className="portal-empty">Analyse de votre dossier en cours…</div> : null}

      {diagnostic ? <>
        <section className="diag-card diag-readiness">
          <div className="diag-card-head"><Target size={18} /><h2>Priorité actuelle</h2></div>
          <div className="diag-readiness-label">{diagnostic.currentPriority}</div>
          <p className="diag-readiness-hint">{diagnostic.nextAction}</p>
        </section>
        <div className="diag-grid">
          <section className="diag-card">
            <div className="diag-card-head diag-card-head--amber"><AlertTriangle size={18} /><h2>Risque principal</h2></div>
            <p>{diagnostic.mainRisk}</p>
          </section>
          <section className="diag-card">
            <div className="diag-card-head diag-card-head--green"><CheckCircle2 size={18} /><h2>Prochaine action</h2></div>
            <p>{diagnostic.nextAction}</p>
          </section>
        </div>
        <section className="diag-card diag-priorities">
          <div className="diag-card-head"><Sparkles size={18} /><h2>Checklist adaptée</h2></div>
          <ol className="diag-priorities-list">{diagnostic.adaptedChecklist.map((item, index) => <li key={item}><span className="diag-priority-num">{index + 1}</span><span>{item}</span></li>)}</ol>
          <div className="diag-actions">
            {canConfirmDiagnostic && !diagnosticReviewed ? (
              <button
                className="btn btn-primary"
                disabled={savingReview}
                onClick={() => void confirmDiagnosticReviewed()}
                type="button"
              >
                {savingReview ? "Enregistrement…" : "J'ai lu et compris mon diagnostic"}
              </button>
            ) : null}
            {diagnosticReviewed ? (
              <span className="portal-tone good">Diagnostic lu et confirmé</span>
            ) : null}
            <AssistantGenieTrigger
              className="btn btn-outline"
              message="Explique-moi mon diagnostic PieAgency avec des mots simples : ma priorité, mon principal risque et les trois actions les plus utiles maintenant."
              requestedAction="explain_diagnostic"
            >
              Comprendre avec Assistant.genie
            </AssistantGenieTrigger>
            <Link href="/espace-etudiant/parcours-guide">Ouvrir mon parcours <ArrowRight size={16} /></Link>
          </div>
          {reviewError ? <div className="portal-warning" role="alert">{reviewError}</div> : null}
        </section>
      </> : null}
    </div>
  );
}
