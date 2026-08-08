"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { CopilotBanner } from "@/components/private/copilot-banner";
import { getPrivateDiagnostic, type PrivateDiagnosticResult } from "@/lib/private-diagnostic";

export function PrivateDiagnosticView() {
  const [diagnostic, setDiagnostic] = useState<PrivateDiagnosticResult | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getPrivateDiagnostic()
      .then((result) => { if (active) setDiagnostic(result); })
      .catch(() => { if (active) setError("Impossible de charger votre diagnostic réel."); });
    return () => { active = false; };
  }, [retryKey]);

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
          <div className="diag-actions"><Link href="/espace-etudiant/parcours-guide">Ouvrir mon parcours <ArrowRight size={16} /></Link></div>
        </section>
      </> : null}
    </div>
  );
}
