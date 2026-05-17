"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { authenticatedFetch } from "@/lib/auth";
import { fetchAdminCandidates, type AdminCandidate } from "@/lib/admin-candidates";
import {
  adminAddDocument,
  adminDeleteDocument,
  adminUpdateDocumentStatus,
  fetchCandidateDocuments,
} from "@/lib/admin-documents";
import type { CandidateDocument, DocumentStatus } from "@/lib/private-documents";

const DOC_PRESETS = [
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

const STATUS_OPTIONS: Array<{ value: DocumentStatus; label: string }> = [
  { value: "not-started", label: "À préparer" },
  { value: "in-progress", label: "En cours" },
  { value: "to-review", label: "À vérifier" },
  { value: "validated", label: "Validé" },
  { value: "rejected", label: "Rejeté" },
];

function DocStatusIcon({ status }: { status: DocumentStatus }) {
  if (status === "validated") return <CheckCircle2 size={15} className="doc-icon-validated" />;
  if (status === "in-progress") return <Clock size={15} className="doc-icon-progress" />;
  if (status === "to-review") return <AlertCircle size={15} className="doc-icon-review" />;
  if (status === "rejected") return <XCircle size={15} className="doc-icon-rejected" />;
  return <span className="doc-icon-none-sm" />;
}

function CandidateDocsPanel({
  candidate,
  onClose,
}: {
  candidate: AdminCandidate;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [addName, setAddName] = useState("");
  const [addCustom, setAddCustom] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchCandidateDocuments(candidate.id).then((d) => {
      setDocs(d);
      setLoading(false);
    });
  }, [candidate.id]);

  async function handleAdd() {
    const name = addName === "Autre" ? addCustom.trim() : addName;
    if (!name) return;
    setAddLoading(true);
    const result = await adminAddDocument(candidate.id, name);
    const optimistic: CandidateDocument = result ?? {
      id: `local-${Date.now()}`,
      title: name,
      status: "not-started",
      priority: "medium",
    };
    setDocs((prev) => [...prev, optimistic]);
    setAddName("");
    setAddCustom("");
    setShowAdd(false);
    setAddLoading(false);
  }

  async function handleStatusChange(doc: CandidateDocument, status: DocumentStatus) {
    if (status === "rejected") {
      setRejectingId(doc.id);
      setRejectNote(doc.note ?? "");
      return;
    }
    setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, status, note: undefined } : d));
    await adminUpdateDocumentStatus(candidate.id, doc.id, status);
  }

  async function handleRejectConfirm(doc: CandidateDocument) {
    setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, status: "rejected" as DocumentStatus, note: rejectNote } : d));
    setRejectingId(null);
    setRejectNote("");
    await adminUpdateDocumentStatus(candidate.id, doc.id, "rejected", rejectNote);
  }

  async function handleDelete(docId: string) {
    setDocs((prev) => prev.filter((d) => d.id !== docId));
    setDeletingId(null);
    await adminDeleteDocument(candidate.id, docId);
  }

  return (
    <div className="crud-overlay" onClick={onClose}>
      <div
        className="crud-modal admin-docs-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crud-modal-head">
          <div>
            <h2><FolderOpen size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />Documents — {candidate.full_name}</h2>
            <p className="admin-docs-sub">{candidate.email ?? candidate.phone ?? ""}</p>
          </div>
          <button className="crud-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="crud-modal-body">
          {loading ? (
            <div className="admin-docs-loading">
              {Array.from({ length: 4 }).map((_, i) => <span key={i} />)}
            </div>
          ) : docs.length === 0 ? (
            <div className="portal-empty" style={{ padding: "24px 0" }}>
              Aucun document. Ajoutez le premier ci-dessous.
            </div>
          ) : (
            <ul className="admin-docs-list">
              {docs.map((doc) => (
                <li className="admin-docs-row" key={doc.id}>
                  <div className="admin-docs-row-left">
                    <DocStatusIcon status={doc.status} />
                    <div>
                      <span className="admin-docs-title">{doc.title}</span>
                      {doc.status === "rejected" && doc.note ? (
                        <span className="admin-docs-note">{doc.note}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="admin-docs-row-right">
                    {rejectingId === doc.id ? (
                      <div className="admin-docs-reject-form">
                        <textarea
                          className="admin-docs-reject-note"
                          onChange={(e) => setRejectNote(e.target.value)}
                          placeholder="Commentaire visible par l'étudiant…"
                          rows={2}
                          value={rejectNote}
                        />
                        <div className="admin-docs-reject-actions">
                          <button className="btn btn-danger" onClick={() => void handleRejectConfirm(doc)} type="button">Confirmer le rejet</button>
                          <button className="btn btn-ghost" onClick={() => setRejectingId(null)} type="button">Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <select
                          className={`admin-docs-status-select status-${doc.status}`}
                          onChange={(e) => void handleStatusChange(doc, e.target.value as DocumentStatus)}
                          value={doc.status}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        {deletingId === doc.id ? (
                          <div className="admin-docs-confirm-del">
                            <span>Supprimer ?</span>
                            <button className="btn btn-danger" onClick={() => void handleDelete(doc.id)} type="button">Oui</button>
                            <button className="btn btn-ghost" onClick={() => setDeletingId(null)} type="button">Non</button>
                          </div>
                        ) : (
                          <button
                            className="crud-btn delete"
                            onClick={() => setDeletingId(doc.id)}
                            title="Supprimer"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showAdd ? (
            <div className="admin-docs-add-form">
              <select
                onChange={(e) => setAddName(e.target.value)}
                value={addName}
              >
                <option value="">Choisir un type…</option>
                {DOC_PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {addName === "Autre" && (
                <input
                  onChange={(e) => setAddCustom(e.target.value)}
                  placeholder="Nom du document"
                  type="text"
                  value={addCustom}
                />
              )}
              <button
                className="btn btn-primary"
                disabled={addLoading || !addName || (addName === "Autre" && !addCustom.trim())}
                onClick={() => void handleAdd()}
                type="button"
              >
                {addLoading ? "Ajout…" : "Ajouter"}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)} type="button">
                Annuler
              </button>
            </div>
          ) : (
            <button
              className="admin-docs-add-btn"
              onClick={() => setShowAdd(true)}
              type="button"
            >
              <Plus size={15} /> Ajouter un document
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("actif")) {
    return "active";
  }
  if (normalized.includes("lead")) {
    return "lead";
  }
  return "closed";
}

function sourceLabel(source: AdminCandidate["source"]) {
  return source === "case" ? "Dossier" : "Lead";
}

export function AdminCandidatesView() {
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [docsCandidate, setDocsCandidate] = useState<AdminCandidate | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const payload = await fetchAdminCandidates();
        if (active) {
          setCandidates(payload);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les candidats.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadCandidates();
    return () => {
      active = false;
    };
  }, []);

  const filteredCandidates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return candidates;
    }

    return candidates.filter((candidate) =>
      [
        candidate.full_name,
        candidate.email ?? "",
        candidate.phone ?? "",
        candidate.country,
        candidate.procedure,
        candidate.stage,
        candidate.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [candidates, query]);

  const selectedCandidates = filteredCandidates.filter((candidate) =>
    selectedIds.includes(candidate.id),
  );

  function toggleSelect(candidateId: string) {
    setSelectedIds((current) =>
      current.includes(candidateId)
        ? current.filter((item) => item !== candidateId)
        : [...current, candidateId],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredCandidates.map((candidate) => candidate.id));
  }

  async function downloadCandidatesExport() {
    setIsExporting(true);
    setErrorMessage("");

    try {
      const response = await authenticatedFetch(
        "/api/admin/exports/contact_requests?format=csv",
        undefined,
        { requireAuth: true },
      );
      if (!response.ok) {
        throw new Error("Impossible de generer l'export candidats.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pieagency-candidats.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de generer l'export candidats.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="admin-candidates-page">
      <section className="admin-candidates-hero">
        <div>
          <span>Cockpit admin</span>
          <h1>Gestion des candidats</h1>
          <p>
            Consultez les leads entrants et les dossiers actifs dans une vue
            exploitable par l&apos;equipe PieAgency.
          </p>
        </div>
        <div className="admin-candidates-count">
          <Users size={20} />
          <strong>{filteredCandidates.length}</strong>
          <span>profil(s)</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <section className="admin-candidates-toolbar">
        <label>
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par nom, pays, procedure..."
            type="search"
            value={query}
          />
        </label>
        <button
          className="btn btn-outline"
          disabled={isExporting}
          onClick={() => void downloadCandidatesExport()}
          type="button"
        >
          <Download size={17} />
          {isExporting ? "Export..." : "Exporter"}
        </button>
      </section>

      <section className="admin-candidates-table-card">
        {isLoading ? (
          <div className="admin-candidates-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredCandidates.length ? (
          <div className="admin-candidates-table-wrap">
            <table className="admin-candidates-table">
              <thead>
                <tr>
                  <th>
                    <input
                      checked={
                        filteredCandidates.length > 0 &&
                        selectedIds.length === filteredCandidates.length
                      }
                      onChange={toggleSelectAll}
                      type="checkbox"
                    />
                  </th>
                  <th>Nom</th>
                  <th>Procedure</th>
                  <th>Etape</th>
                  <th>Acces</th>
                  <th>Statut</th>
                  <th>Recu</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td>
                      <input
                        checked={selectedIds.includes(candidate.id)}
                        onChange={() => toggleSelect(candidate.id)}
                        type="checkbox"
                      />
                    </td>
                    <td>
                      <strong>{candidate.full_name}</strong>
                      <span>{candidate.email || candidate.phone || "Contact non renseigne"}</span>
                      <small>{candidate.country}</small>
                    </td>
                    <td>{candidate.procedure}</td>
                    <td>
                      <span className="admin-candidates-chip">{candidate.stage}</span>
                    </td>
                    <td>{candidate.subscription}</td>
                    <td>
                      <span className={`admin-candidates-status ${statusClass(candidate.status)}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td>
                      <span>{candidate.created_at_label}</span>
                      <small>{sourceLabel(candidate.source)}</small>
                    </td>
                    <td>
                      <button
                        aria-label="Gérer les documents"
                        className="admin-docs-eye-btn"
                        onClick={() => setDocsCandidate(candidate)}
                        title="Gérer les documents"
                        type="button"
                      >
                        <FolderOpen size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && !filteredCandidates.length ? (
          <div className="portal-empty">
            Aucun candidat ne correspond a cette recherche.
          </div>
        ) : null}
      </section>

      {selectedCandidates.length ? (
        <section className="admin-candidates-selection">
          <strong>
            {selectedCandidates.length} candidat
            {selectedCandidates.length > 1 ? "s" : ""} selectionne
            {selectedCandidates.length > 1 ? "s" : ""}
          </strong>
          <span>
            Les actions de masse seront activees apres ajout des endpoints email
            et moderation candidats.
          </span>
        </section>
      ) : null}

      {docsCandidate ? (
        <CandidateDocsPanel
          candidate={docsCandidate}
          onClose={() => setDocsCandidate(null)}
        />
      ) : null}
    </div>
  );
}
