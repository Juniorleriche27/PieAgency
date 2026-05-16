"use client";

import { CheckCircle2, Clock, AlertCircle, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getDocuments,
  type CandidateDocument,
  type DocumentStatus,
} from "@/lib/private-documents";

type Props = {
  documents: CandidateDocument[];
};

function statusLabel(status: DocumentStatus) {
  if (status === "validated") return "Validé";
  if (status === "in-progress") return "En cours";
  if (status === "to-review") return "À vérifier";
  return "À préparer";
}

function StatusIcon({ status }: { status: DocumentStatus }) {
  if (status === "validated") return <CheckCircle2 size={18} aria-hidden className="doc-icon-validated" />;
  if (status === "in-progress") return <Clock size={18} aria-hidden className="doc-icon-progress" />;
  if (status === "to-review") return <AlertCircle size={18} aria-hidden className="doc-icon-review" />;
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="doc-icon-none">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export function DocumentsView({ documents }: Props) {
  const [liveDocuments, setLiveDocuments] = useState(documents);

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      const nextDocuments = await getDocuments();
      if (active) {
        setLiveDocuments(nextDocuments);
      }
    }

    void loadDocuments();
    return () => {
      active = false;
    };
  }, []);

  const validated = liveDocuments.filter((d) => d.status === "validated").length;
  const inProgress = liveDocuments.filter((d) => d.status === "in-progress").length;
  const toReview = liveDocuments.filter((d) => d.status === "to-review").length;
  const pct = liveDocuments.length ? Math.round((validated / liveDocuments.length) * 100) : 0;
  const highPriority = liveDocuments.filter((d) => d.priority === "high");

  return (
    <div className="doc-page">
      {/* Header */}
      <div className="doc-page-head">
        <h1>Mes documents</h1>
        <p>Suivez l&apos;état de vos documents et préparez votre dossier complet.</p>
      </div>

      {/* Stats */}
      <div className="doc-stats">
        <div className="doc-stat-card">
          <span className="doc-stat-num validated">{validated}</span>
          <span className="doc-stat-label">Validés</span>
        </div>
        <div className="doc-stat-card">
          <span className="doc-stat-num progress">{inProgress}</span>
          <span className="doc-stat-label">En cours</span>
        </div>
        <div className="doc-stat-card">
          <span className="doc-stat-num review">{toReview}</span>
          <span className="doc-stat-label">À vérifier</span>
        </div>
        <div className="doc-stat-card">
          <span className="doc-stat-num">{pct}%</span>
          <span className="doc-stat-label">Complétude</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="doc-progress-card">
        <p className="doc-progress-title">Progression globale du dossier</p>
        <div className="doc-progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="doc-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="doc-progress-sub">{validated} sur {liveDocuments.length} documents validés</p>
      </div>

      {/* High priority alert */}
      {highPriority.length > 0 && (
        <div className="doc-priority-card">
          <p className="doc-priority-title">Documents prioritaires</p>
          <p className="doc-priority-sub">Ces documents doivent être préparés en priorité</p>
          <ul className="doc-priority-list">
            {highPriority.map((doc) => (
              <li key={doc.id} className="doc-priority-item">
                <div className="doc-priority-left">
                  <StatusIcon status={doc.status} />
                  <div>
                    <p className="doc-item-title">{doc.title}</p>
                    <p className="doc-item-date">
                      {doc.lastUpdated ? `Mis à jour le ${doc.lastUpdated}` : "Pas encore commencé"}
                    </p>
                  </div>
                </div>
                <span className={`doc-badge doc-badge-${doc.status}`}>{statusLabel(doc.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All documents */}
      <div className="doc-list-section">
        <div className="doc-list-header">
          <h2>Tous les documents</h2>
          {/* Upload disabled — backend endpoint not yet available */}
          <button className="btn btn-outline doc-upload-btn" type="button" disabled title="Bientôt disponible">
            <Upload size={16} aria-hidden />
            Ajouter un document
          </button>
        </div>

        <ul className="doc-list">
          {liveDocuments.map((doc) => (
            <li
              key={doc.id}
              className={`doc-row doc-priority-border-${doc.priority ?? "low"}`}
            >
              <div className="doc-row-left">
                <StatusIcon status={doc.status} />
                <div>
                  <p className="doc-item-title">{doc.title}</p>
                  <p className="doc-item-date">
                    {doc.lastUpdated ? `Mis à jour le ${doc.lastUpdated}` : "Pas encore commencé"}
                  </p>
                </div>
              </div>
              <div className="doc-row-right">
                <span className={`doc-badge doc-badge-${doc.status}`}>{statusLabel(doc.status)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
