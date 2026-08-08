"use client";

import { CopilotBanner } from "@/components/private/copilot-banner";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileUp,
  Download,
  Paperclip,
  Plus,
  Upload,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDocument,
  getDocuments,
  getProfile,
  updateProfile,
  uploadDocumentFile,
  getDocumentDownloadUrl,
  deleteDocument,
  type CandidateDocument,
  type CandidateProfile,
  type DocumentStatus,
  type EducationLevel,
  type GradingSystem,
} from "@/lib/private-documents";
import { buildDefaultDocumentTemplates, buildDocumentTemplates } from "@/lib/document-templates";
import {
  fetchOnboardingStatus,
  ONBOARDING_DRAFT_STORAGE_KEY,
  ONBOARDING_STEP_STORAGE_KEY,
  submitOnboarding,
  type OnboardingData,
  type OnboardingStatus,
} from "@/lib/private-onboarding";

const DOCUMENT_PRESETS = [
  "CV",
  "Projet d'études",
  "Projet professionnel",
  "Lettre de motivation",
  "Relevés de notes",
  "Passeport",
  "Justificatif hébergement",
  "Justificatif financement",
  "Documents visa",
  "Admission",
  "Autre",
];

function isGeneratedDocument(doc: CandidateDocument) {
  return doc.id.startsWith("tpl-") || doc.id.startsWith("doc-default-");
}

function buildVisibleDocuments(
  documents: CandidateDocument[],
  profile: CandidateProfile,
): CandidateDocument[] {
  if (documents.length > 0) return documents;
  if (profile.education_level) {
    return buildDocumentTemplates(profile.education_level, profile.grading_system ?? "semestre");
  }
  return buildDefaultDocumentTemplates();
}

type Props = {
  documents: CandidateDocument[];
};

function statusLabel(status: DocumentStatus) {
  if (status === "validated") return "Validé";
  if (status === "in-progress") return "En cours";
  if (status === "to-review") return "À vérifier";
  if (status === "rejected") return "Rejeté";
  return "À préparer";
}

function StatusIcon({ status }: { status: DocumentStatus }) {
  if (status === "validated")
    return <CheckCircle2 size={18} aria-hidden className="doc-icon-validated" />;
  if (status === "in-progress")
    return <Clock size={18} aria-hidden className="doc-icon-progress" />;
  if (status === "to-review")
    return <AlertCircle size={18} aria-hidden className="doc-icon-review" />;
  if (status === "rejected")
    return <XCircle size={18} aria-hidden className="doc-icon-rejected" />;
  return (
    <svg
      aria-hidden
      className="doc-icon-none"
      fill="none"
      height={18}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={18}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

const LEVEL_OPTIONS: Array<{ value: EducationLevel; label: string }> = [
  { value: "lycee", label: "Lycée (Seconde → Terminale)" },
  { value: "universite", label: "Université (Licence / Master)" },
  { value: "bts", label: "BTS / Autre diplôme" },
  { value: "autre", label: "Autre formation" },
];

const SYSTEM_OPTIONS: Array<{ value: GradingSystem; label: string }> = [
  { value: "trimestre", label: "Trimestriel (3 bulletins par année)" },
  { value: "semestre", label: "Semestriel (2 bulletins par année)" },
];

function LevelSetup({
  onConfirm,
}: {
  onConfirm: (level: EducationLevel, system: GradingSystem) => void;
}) {
  const [level, setLevel] = useState<EducationLevel>("lycee");
  const [system, setSystem] = useState<GradingSystem>("trimestre");

  return (
    <div className="doc-setup-card">
      <h2 className="doc-setup-title">Configurer votre dossier</h2>
      <p className="doc-setup-sub">
        Indiquez votre niveau d&apos;études pour que nous pré-remplissions votre liste de documents.
      </p>

      <div className="doc-setup-field">
        <label>Niveau d&apos;études</label>
        <div className="doc-setup-options">
          {LEVEL_OPTIONS.map((o) => (
            <button
              className={`doc-setup-option${level === o.value ? " selected" : ""}`}
              key={o.value}
              onClick={() => setLevel(o.value)}
              type="button"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="doc-setup-field">
        <label>Système de notation</label>
        <div className="doc-setup-options">
          {SYSTEM_OPTIONS.map((o) => (
            <button
              className={`doc-setup-option${system === o.value ? " selected" : ""}`}
              key={o.value}
              onClick={() => setSystem(o.value)}
              type="button"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary doc-setup-confirm"
        onClick={() => onConfirm(level, system)}
        type="button"
      >
        Générer ma liste de documents
      </button>
    </div>
  );
}

export function DocumentsView({ documents: initial }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState(initial);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>(null);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingData | null>(null);
  const [finishLoading, setFinishLoading] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [finishDone, setFinishDone] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCustom, setAddCustom] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let active = true;
    void Promise.all([getDocuments(), getProfile()])
      .then(([d, p]) => {
        if (!active) return;
        setDocs(buildVisibleDocuments(d, p));
        setProfile(p);
        setLoadError("");
      })
      .catch(() => {
        if (active) setLoadError("Impossible de charger vos documents. Réessayez dans un instant.");
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void fetchOnboardingStatus().then((status) => {
      if (active) setOnboardingStatus(status);
    });

    const rawDraft = window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (rawDraft) {
      try {
        setOnboardingDraft(JSON.parse(rawDraft) as OnboardingData);
      } catch {
        window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
      }
    }

    return () => { active = false; };
  }, []);

  async function handleLevelConfirm(level: EducationLevel, system: GradingSystem) {
    await updateProfile({ education_level: level, grading_system: system });
    setProfile({ education_level: level, grading_system: system });
    if (docs.length === 0 || docs.every(isGeneratedDocument)) {
      const templates = buildDocumentTemplates(level, system);
      setDocs(templates);
    }
  }

  const validated = docs.filter((d) => d.status === "validated").length;
  const inProgress = docs.filter((d) => d.status === "in-progress").length;
  const toReview = docs.filter((d) => d.status === "to-review").length;
  const pct = docs.length ? Math.round((validated / docs.length) * 100) : 0;
  const highPriority = docs.filter((d) => d.priority === "high" && d.status !== "validated");

  function openAdd() {
    setAddName("");
    setAddCustom("");
    setAddFile(null);
    setAddError("");
    setShowAddModal(true);
  }

  async function handleAdd() {
    const name = addName === "Autre" ? addCustom.trim() : addName.trim();
    if (!name) { setAddError("Veuillez saisir un nom de document."); return; }
    setAddLoading(true);
    setAddError("");
    const result = await addDocument(name);
    if (result) {
      setDocs((prev) => [...prev, result]);
    } else {
      setAddError("Le document n'a pas été enregistré. Veuillez réessayer.");
      setAddLoading(false);
      return;
    }
    setAddLoading(false);
    setShowAddModal(false);
    if (addFile && result) {
      await uploadDocumentFile(result.id, addFile);
    }
  }

  async function handleRowUpload(doc: CandidateDocument, file: File) {
    setUploadingId(doc.id);
    const persistedDoc = isGeneratedDocument(doc) ? await addDocument(doc.title) : doc;
    if (!persistedDoc) {
      setUploadingId(null);
      return;
    }
    const ok = await uploadDocumentFile(persistedDoc.id, file);
    setUploadingId(null);
    if (ok) {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...persistedDoc, status: "in-progress" as DocumentStatus, lastUpdated: new Date().toISOString().slice(0, 10) }
            : d,
        ),
      );
      setUploadSuccess(persistedDoc.id);
      setTimeout(() => setUploadSuccess(null), 3000);
    } else if (persistedDoc.id !== doc.id) {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? persistedDoc : d)));
    }
  }

  async function handleFinishOnboarding() {
    if (!onboardingDraft) {
      router.push("/espace-etudiant/onboarding");
      return;
    }

    setFinishLoading(true);
    setFinishError("");
    try {
      const payload = {
        ...onboardingDraft,
        country:
          onboardingDraft.country === "Autre"
            ? onboardingDraft.countryOther?.trim() || "Autre"
            : onboardingDraft.country,
        mainNeed: onboardingDraft.mainNeed?.split("|||").filter(Boolean).join(", ") ?? "",
      };
      await submitOnboarding(payload);
      window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(ONBOARDING_STEP_STORAGE_KEY);
      setOnboardingStatus("submitted");
      setOnboardingDraft(null);
      setFinishDone(true);
    } catch (error) {
      setFinishError(
        error instanceof Error
          ? error.message
          : "Impossible de finaliser l'embarquement.",
      );
    } finally {
      setFinishLoading(false);
    }
  }

  const showSetup = !profileLoading && profile && !profile.education_level;
  const showOnboardingFinish =
    onboardingStatus !== null &&
    onboardingStatus !== "validated" &&
    onboardingStatus !== "submitted" &&
    onboardingStatus !== "under_review";

  return (
    <div className="doc-page">
      <CopilotBanner />
      <div className="doc-page-head">
        <h1>Mes documents</h1>
        <p>Suivez l&apos;état de vos documents et préparez votre dossier complet.</p>
      </div>
      {loadError ? <div className="portal-warning" role="alert">{loadError}</div> : null}

      {showOnboardingFinish ? (
        <div className="doc-onboarding-card">
          <div>
            <p className="doc-onboarding-eyebrow">Embarquement</p>
            <h2>Finalisez votre dossier de départ</h2>
            <p>
              Une fois vos documents joints, envoyez votre embarquement à l&apos;équipe PieAgency pour analyse et validation.
            </p>
            {finishError ? <p className="crud-error">{finishError}</p> : null}
          </div>
          <div className="doc-onboarding-actions">
            <Link className="btn btn-outline" href="/espace-etudiant/onboarding">
              Retour Embarquement
            </Link>
            <button
              className="btn btn-primary"
              disabled={finishLoading}
              onClick={() => void handleFinishOnboarding()}
              type="button"
            >
              {finishLoading ? "Envoi..." : <>Terminer l&apos;embarquement</>}
            </button>
          </div>
        </div>
      ) : null}

      {finishDone ? (
        <div className="portal-warning doc-finish-success">
          Votre embarquement a été envoyé. L&apos;équipe PieAgency va analyser votre dossier avant ouverture complète de l&apos;espace de suivi.
        </div>
      ) : null}

      {showSetup ? (
        <LevelSetup onConfirm={(l, s) => void handleLevelConfirm(l, s)} />
      ) : null}

      <>
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

          <div className="doc-progress-card">
            <p className="doc-progress-title">Progression globale du dossier</p>
            <div
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={pct}
              className="doc-progress-bar"
              role="progressbar"
            >
              <div className="doc-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="doc-progress-sub">
              {validated} sur {docs.length} documents validés
            </p>
          </div>

          {highPriority.length > 0 && (
            <div className="doc-priority-card">
              <p className="doc-priority-title">Documents prioritaires</p>
              <p className="doc-priority-sub">
                Ces documents doivent être préparés en priorité
              </p>
              <ul className="doc-priority-list">
                {highPriority.map((doc) => (
                  <li className="doc-priority-item" key={doc.id}>
                    <div className="doc-priority-left">
                      <StatusIcon status={doc.status} />
                      <div>
                        <p className="doc-item-title">{doc.title}</p>
                        <p className="doc-item-date">
                          {doc.lastUpdated
                            ? `Mis à jour le ${doc.lastUpdated}`
                            : "Pas encore commencé"}
                        </p>
                      </div>
                    </div>
                    <span className={`doc-badge doc-badge-${doc.status}`}>
                      {statusLabel(doc.status)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="doc-list-section">
            <div className="doc-list-header">
              <h2>Tous les documents</h2>
              <button className="btn btn-outline doc-upload-btn" onClick={openAdd} type="button">
                <Upload size={16} aria-hidden />
                Ajouter un document
              </button>
            </div>

            {docs.length === 0 ? (
              <div className="portal-empty">
                Aucun document. Cliquez sur &quot;Ajouter un document&quot; pour commencer.
              </div>
            ) : (
              <ul className="doc-list">
                {docs.map((doc) => (
                  <li
                    className={`doc-row doc-priority-border-${doc.priority ?? "low"}${doc.status === "rejected" ? " doc-row-rejected" : ""}`}
                    key={doc.id}
                  >
                    <div className="doc-row-left">
                      <StatusIcon status={doc.status} />
                      <div>
                        <p className="doc-item-title">{doc.title}</p>
                        {doc.status === "rejected" && doc.note ? (
                          <p className="doc-item-comment">
                            <span className="doc-comment-label">Commentaire admin :</span> {doc.note}
                          </p>
                        ) : (
                          <p className="doc-item-date">
                            {doc.lastUpdated
                              ? `Mis à jour le ${doc.lastUpdated}`
                              : "Pas encore commencé"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="doc-row-right">
                      <span className={`doc-badge doc-badge-${doc.status}`}>
                        {statusLabel(doc.status)}
                      </span>
                      {uploadSuccess === doc.id ? (
                        <span className="doc-upload-ok">
                          <CheckCircle2 size={14} /> Envoyé
                        </span>
                      ) : (
                        <>
                          <input
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            className="doc-file-hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleRowUpload(doc, f);
                              e.target.value = "";
                            }}
                            ref={(el) => { rowFileRefs.current[doc.id] = el; }}
                            type="file"
                          />
                          <button
                            className="doc-attach-btn"
                            disabled={uploadingId === doc.id}
                            onClick={() => rowFileRefs.current[doc.id]?.click()}
                            title="Joindre un fichier"
                            type="button"
                          >
                            {uploadingId === doc.id ? (
                              <span className="doc-spinner" />
                            ) : (
                              <Paperclip size={14} />
                            )}
                            {uploadingId === doc.id ? "Envoi…" : "Joindre"}
                          </button>
                        </>
                      )}
                      {!isGeneratedDocument(doc) ? <>
                        <button aria-label={`Télécharger ${doc.title}`} className="doc-attach-btn" onClick={async () => { try { window.open(await getDocumentDownloadUrl(doc.id), "_blank", "noopener,noreferrer"); } catch { setLoadError("Aucun fichier téléchargeable pour ce document."); } }} type="button"><Download size={14} /> Télécharger</button>
                        <button aria-label={`Supprimer ${doc.title}`} className="doc-attach-btn" onClick={async () => { if (!window.confirm(`Supprimer « ${doc.title} » ?`)) return; try { await deleteDocument(doc.id); setDocs((items) => items.filter((item) => item.id !== doc.id)); } catch { setLoadError("Impossible de supprimer ce document."); } }} type="button"><Trash2 size={14} /> Supprimer</button>
                      </> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showOnboardingFinish ? (
            <div className="doc-bottom-finish-card">
              <div>
                <p className="doc-onboarding-eyebrow">Dernière étape</p>
                <h2>Documents ajoutés ? Finalisez l&apos;embarquement.</h2>
                <p>
                  Envoyez votre dossier à l&apos;équipe PieAgency pour analyse et validation.
                </p>
              </div>
              <button
                className="btn btn-primary"
                disabled={finishLoading}
                onClick={() => void handleFinishOnboarding()}
                type="button"
              >
                {finishLoading ? "Envoi..." : <>Terminer l&apos;embarquement</>}
              </button>
            </div>
          ) : null}
      </>

      {showAddModal ? (
        <div className="crud-overlay" onClick={() => setShowAddModal(false)}>
          <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crud-modal-head">
              <h2>Ajouter un document</h2>
              <button className="crud-close" onClick={() => setShowAddModal(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="crud-modal-body">
              <div className="crud-field">
                <label>Type de document *</label>
                <select
                  onChange={(e) => { setAddName(e.target.value); setAddError(""); }}
                  value={addName}
                >
                  <option value="">Sélectionner…</option>
                  {DOCUMENT_PRESETS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {addName === "Autre" && (
                <div className="crud-field">
                  <label>Nom du document *</label>
                  <input
                    onChange={(e) => { setAddCustom(e.target.value); setAddError(""); }}
                    placeholder="Ex : Acte de naissance"
                    type="text"
                    value={addCustom}
                  />
                </div>
              )}

              <div className="crud-field">
                <label>Fichier (optionnel)</label>
                <div className="doc-file-drop">
                  <input
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    className="doc-file-hidden"
                    onChange={(e) => setAddFile(e.target.files?.[0] ?? null)}
                    ref={fileInputRef}
                    type="file"
                  />
                  <button
                    className="doc-file-pick-btn"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <FileUp size={16} />
                    {addFile ? addFile.name : "Choisir un fichier"}
                  </button>
                  {addFile && (
                    <button className="doc-file-clear" onClick={() => setAddFile(null)} type="button">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <span className="crud-hint">PDF, Word, JPG ou PNG — max 10 Mo</span>
              </div>

              {addError && <p className="crud-error">{addError}</p>}
            </div>

            <div className="crud-modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)} type="button">
                Annuler
              </button>
              <button
                className="btn btn-primary"
                disabled={addLoading || (!addName || (addName === "Autre" && !addCustom.trim()))}
                onClick={() => void handleAdd()}
                type="button"
              >
                <Plus size={16} />
                {addLoading ? "Ajout…" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
