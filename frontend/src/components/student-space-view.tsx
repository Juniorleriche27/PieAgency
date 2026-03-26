"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionLink } from "@/components/action-link";
import { PortalAccessPanel } from "@/components/portal-access-panel";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authenticatedFetch, getApiBaseUrl } from "@/lib/auth";

type MetricTone = "neutral" | "good" | "attention" | "info";
type StudentStepStatus = "done" | "current" | "todo";
type StudentDocumentStatus = "approved" | "review" | "missing";

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
};

type StudentStepItem = {
  title: string;
  description: string;
  status: StudentStepStatus;
  due_label?: string | null;
};

type StudentDocumentItem = {
  name: string;
  status: StudentDocumentStatus;
  note: string;
};

type StudentNoteItem = {
  title: string;
  content: string;
  created_at_label: string;
};

type StudentDashboardResponse = {
  student_name: string;
  case_reference: string;
  project_name: string;
  status_label: string;
  progress_percent: number;
  completed_steps: number;
  total_steps: number;
  assigned_counselor: string;
  next_action: string;
  last_update_label: string;
  metrics: DashboardMetric[];
  steps: StudentStepItem[];
  documents: StudentDocumentItem[];
  notes: StudentNoteItem[];
};

const emptyStudentDashboard: StudentDashboardResponse = {
  student_name: "Espace etudiant",
  case_reference: "En attente",
  project_name: "Aucun dossier",
  status_label: "Connexion requise",
  progress_percent: 0,
  completed_steps: 0,
  total_steps: 0,
  assigned_counselor: "A definir",
  next_action: "Connectez-vous pour voir votre progression.",
  last_update_label: "Non charge",
  metrics: [],
  steps: [],
  documents: [],
  notes: [],
};

export function StudentSpaceView() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { session, isReady } = useAuthSession(apiBaseUrl);
  const [dashboard, setDashboard] = useState<StudentDashboardResponse>(
    emptyStudentDashboard,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!session || session.user.role !== "student") {
      setDashboard(emptyStudentDashboard);
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadDashboard() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await authenticatedFetch(
          "/api/student-space",
          { cache: "no-store" },
          { apiBaseUrl, requireAuth: true },
        );
        if (!response.ok) {
          throw new Error("Impossible de charger le suivi du dossier.");
        }

        const payload = (await response.json()) as StudentDashboardResponse;
        if (active) {
          setDashboard(payload);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setDashboard(emptyStudentDashboard);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Impossible de charger le suivi du dossier.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [apiBaseUrl, isReady, session]);

  if (!isReady) {
    return (
      <div className="portal-shell">
        <div className="portal-access-card">
          <div className="portal-card-kicker">Authentification</div>
          <h2>Verification de la session</h2>
          <p>Chargement de votre acces a l&apos;espace etudiant...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <PortalAccessPanel
        description="Cet espace est reserve aux etudiants connectes. Connectez-vous pour suivre vos etapes, vos documents et les retours du conseiller."
        kicker="Connexion requise"
        primaryHref="/connexion?next=/espace-etudiant"
        primaryLabel="Se connecter"
        secondaryHref="/connexion?mode=signup&next=/espace-etudiant"
        secondaryLabel="Creer un compte"
        title="Acces protege"
      />
    );
  }

  if (session.user.role !== "student") {
    return (
      <PortalAccessPanel
        description="Votre session actuelle est admin. Utilisez plutot le cockpit interne pour piloter la plateforme."
        kicker="Role incompatible"
        primaryHref="/admin"
        primaryLabel="Ouvrir l'admin"
        secondaryHref="/connexion?next=/espace-etudiant"
        secondaryLabel="Changer de compte"
        title="Cet espace n&apos;est pas pour ce profil"
      />
    );
  }

  return (
    <div className="portal-shell">
      <div className="portal-banner">
        <div>
          <div className="portal-kicker">Espace etudiant</div>
          <h2>
            {dashboard.student_name} - {dashboard.project_name}
          </h2>
          <p>
            Reference dossier: {dashboard.case_reference} - {dashboard.status_label}
          </p>
        </div>
        <div className="portal-banner-meta">
          <span className="portal-pill good">{dashboard.status_label}</span>
          <span>{isLoading ? "Synchronisation..." : dashboard.last_update_label}</span>
        </div>
      </div>

      {loadError ? <div className="portal-warning">{loadError}</div> : null}

      <div className="portal-metrics">
        {dashboard.metrics.map((metric) => (
          <div className="portal-metric" key={metric.label}>
            <div className="portal-metric-label">{metric.label}</div>
            <div className="portal-metric-value">{metric.value}</div>
            <div className={`portal-tone ${metric.tone}`}>{metric.detail}</div>
          </div>
        ))}
      </div>

      <div className="portal-grid">
        <div className="portal-card">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">Progression</div>
              <h3>Suivi du dossier</h3>
            </div>
            <div className="portal-progress-meta">
              {dashboard.completed_steps}/{dashboard.total_steps} etapes
            </div>
          </div>
          <div className="portal-progress">
            <div
              className="portal-progress-bar"
              style={{ width: `${dashboard.progress_percent}%` }}
            />
          </div>
          <div className="portal-step-list">
            {dashboard.steps.length ? (
              dashboard.steps.map((step) => (
                <div className={`portal-step ${step.status}`} key={step.title}>
                  <div className="portal-step-indicator">
                    {step.status === "done"
                      ? "OK"
                      : step.status === "current"
                        ? "EN"
                        : "..."}
                  </div>
                  <div className="portal-step-body">
                    <div className="portal-step-title">{step.title}</div>
                    <p>{step.description}</p>
                    {step.due_label ? (
                      <div className="portal-step-due">{step.due_label}</div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="portal-empty">
                Aucune etape n&apos;est encore visible dans votre dossier.
              </div>
            )}
          </div>
        </div>

        <div className="portal-stack">
          <div className="portal-card">
            <div className="portal-card-kicker">Action immediate</div>
            <h3>Prochain point a traiter</h3>
            <p>{dashboard.next_action}</p>
            <div className="portal-actions">
              <ActionLink href="/contact" variant="primary">
                Contacter PieAgency
              </ActionLink>
              <button
                className="btn btn-outline"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("pieagency-chat-open"))
                }
                type="button"
              >
                Ouvrir le chat
              </button>
            </div>
          </div>

          <div className="portal-card">
            <div className="portal-card-kicker">Documents</div>
            <h3>Centre de dossier</h3>
            <div className="portal-doc-list">
              {dashboard.documents.length ? (
                dashboard.documents.map((document) => (
                  <div className="portal-doc" key={document.name}>
                    <div>
                      <div className="portal-doc-name">{document.name}</div>
                      <p>{document.note}</p>
                    </div>
                    <span className={`portal-pill ${document.status}`}>
                      {document.status === "approved"
                        ? "Valide"
                        : document.status === "review"
                          ? "En revue"
                          : "Manquant"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="portal-empty">
                  Aucun document n&apos;est encore rattache a votre espace.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-head">
          <div>
            <div className="portal-card-kicker">Notes du conseiller</div>
            <h3>Historique recent</h3>
          </div>
          <div className="portal-progress-meta">
            Responsable: {dashboard.assigned_counselor}
          </div>
        </div>
        <div className="portal-note-list">
          {dashboard.notes.length ? (
            dashboard.notes.map((note) => (
              <div className="portal-note" key={`${note.title}-${note.created_at_label}`}>
                <div className="portal-note-head">
                  <strong>{note.title}</strong>
                  <span>{note.created_at_label}</span>
                </div>
                <p>{note.content}</p>
              </div>
            ))
          ) : (
            <div className="portal-empty">
              Aucun commentaire conseiller n&apos;est disponible pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
