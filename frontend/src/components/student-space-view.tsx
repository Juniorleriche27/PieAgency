"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionLink } from "@/components/action-link";
import { AssistantGenieTrigger } from "@/components/private/assistant-genie-trigger";
import { PortalAccessPanel } from "@/components/portal-access-panel";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authenticatedFetch, getApiBaseUrl } from "@/lib/auth";
import {
  fetchProgressivePath,
  type ProgressivePath,
  type ProgressiveStep,
} from "@/lib/progressive-path";

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
  student_name: "Espace étudiant",
  case_reference: "En attente",
  project_name: "Aucun dossier",
  status_label: "Connexion requise",
  progress_percent: 0,
  completed_steps: 0,
  total_steps: 0,
  assigned_counselor: "À définir",
  next_action: "Connectez-vous pour voir votre progression.",
  last_update_label: "Non chargé",
  metrics: [],
  steps: [],
  documents: [],
  notes: [],
};

function completedCount(path: ProgressivePath | null) {
  return path?.steps.filter((step) => step.status === "completed").length ?? 0;
}

function nextStepAfter(path: ProgressivePath | null, current: ProgressiveStep | null) {
  if (!path || !current) return null;
  return (
    path.steps.find(
      (step) => step.order > current.order && step.status !== "completed",
    ) ?? null
  );
}

export function StudentSpaceView() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { session, isReady } = useAuthSession(apiBaseUrl);
  const canViewStudentSpace =
    session?.user.role === "student" || session?.user.role === "admin";

  const [dashboard, setDashboard] = useState<StudentDashboardResponse>(
    emptyStudentDashboard,
  );
  const [path, setPath] = useState<ProgressivePath | null>(null);
  const [loadError, setLoadError] = useState("");
  const [dismissedPromotionKey, setDismissedPromotionKey] = useState("");

  useEffect(() => {
    if (!isReady) return;
    if (!session || !canViewStudentSpace) {
      setDashboard(emptyStudentDashboard);
      setPath(null);
      return;
    }

    let active = true;

    async function loadCockpit() {
      setLoadError("");
      try {
        const dashboardRequest = authenticatedFetch(
          "/api/student-space",
          { cache: "no-store" },
          { apiBaseUrl, requireAuth: true },
        );
        const pathRequest = fetchProgressivePath();
        const [dashboardResponse, pathPayload] = await Promise.all([
          dashboardRequest,
          pathRequest,
        ]);

        if (!dashboardResponse.ok) {
          throw new Error("Impossible de charger le cockpit étudiant.");
        }

        const dashboardPayload =
          (await dashboardResponse.json()) as StudentDashboardResponse;
        if (active) {
          setDashboard(dashboardPayload);
          setPath(pathPayload);
        }
      } catch (error) {
        if (!active) return;
        setDashboard(emptyStudentDashboard);
        setPath(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Impossible de charger le cockpit étudiant.",
        );
      }
    }

    void loadCockpit();
    return () => {
      active = false;
    };
  }, [apiBaseUrl, canViewStudentSpace, isReady, session]);

  const activeProductPromotion = path?.recommendations.recommended_product ?? null;
  const activePromotionKey = activeProductPromotion && path?.current_step
    ? `${path.current_step.id}:${activeProductPromotion.target_path}`
    : "";

  useEffect(() => {
    if (!session?.user.user_id || !activePromotionKey) {
      setDismissedPromotionKey("");
      return;
    }
    const storageKey = `pie.product-promo.dismissed.${session.user.user_id}.${activePromotionKey}`;
    setDismissedPromotionKey(
      window.localStorage.getItem(storageKey) === "1" ? activePromotionKey : "",
    );
  }, [activePromotionKey, session?.user.user_id]);

  function dismissProductPromotion() {
    if (!session?.user.user_id || !activePromotionKey) return;
    const storageKey = `pie.product-promo.dismissed.${session.user.user_id}.${activePromotionKey}`;
    window.localStorage.setItem(storageKey, "1");
    setDismissedPromotionKey(activePromotionKey);
  }

  if (!isReady) {
    return (
      <div className="portal-shell">
        <div className="portal-access-card">
          <div className="portal-card-kicker">Authentification</div>
          <h2>Vérification de la session</h2>
          <p>Chargement de votre espace étudiant…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <PortalAccessPanel
        description="Connectez-vous pour retrouver votre parcours, vos documents et vos prochaines actions."
        kicker="Connexion requise"
        primaryHref="/connexion?next=/espace-etudiant"
        primaryLabel="Se connecter"
        secondaryHref="/connexion?mode=signup&next=/espace-etudiant"
        secondaryLabel="Créer un compte"
        title="Votre parcours PieAgency"
      />
    );
  }

  if (!canViewStudentSpace) {
    return (
      <PortalAccessPanel
        description="Votre session actuelle ne permet pas d'ouvrir cet espace."
        kicker="Rôle incompatible"
        primaryHref="/admin"
        primaryLabel="Ouvrir l'admin"
        secondaryHref="/connexion?next=/espace-etudiant"
        secondaryLabel="Changer de compte"
        title="Cet espace n'est pas pour ce profil"
      />
    );
  }

  const currentStep = path?.current_step ?? null;
  const followingStep = nextStepAfter(path, currentStep);
  const progress = path?.progress_percent ?? dashboard.progress_percent;
  const doneSteps = path ? completedCount(path) : dashboard.completed_steps;
  const totalSteps = path?.steps.length ?? dashboard.total_steps;
  const missingDocuments = dashboard.documents.filter(
    (document) => document.status === "missing",
  );
  const reviewDocuments = dashboard.documents.filter(
    (document) => document.status === "review",
  );
  const requiredItems = currentStep?.requirements.filter((item) => item.required) ?? [];
  const satisfiedRequired = requiredItems.filter((item) => item.satisfied).length;
  const primaryTarget = currentStep?.target_path || "/espace-etudiant/parcours-guide";
  const productPromotion = activeProductPromotion;
  const promotionKey = activePromotionKey;
  const showProductPromotion = Boolean(
    productPromotion && promotionKey && dismissedPromotionKey !== promotionKey,
  );


  return (
    <div className="portal-shell portal-shell-premium">
      {loadError ? <div className="portal-warning">{loadError}</div> : null}

      <section className="student-premium-hero" aria-labelledby="cockpit-title">
        <div>
          <div className="portal-card-kicker">Votre cockpit étudiant</div>
          <h1 id="cockpit-title">Bonjour {dashboard.student_name}</h1>
          <p>
            {dashboard.project_name} · Référence {dashboard.case_reference}
          </p>
          <div className="student-premium-tags">
            <span>{dashboard.status_label}</span>
            <span>Mis à jour {dashboard.last_update_label}</span>
          </div>
        </div>

        <div className="student-premium-progress-card" aria-label={`Progression ${progress}%`}>
          <span>Progression réelle</span>
          <strong>{progress}%</strong>
          <div className="portal-progress compact">
            <div className="portal-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <small>
            {doneSteps}/{totalSteps || 15} étapes validées
          </small>
        </div>
      </section>

      <section className="student-next-action-panel" aria-labelledby="current-step-title">
        <div className="student-cockpit-main">
          <span>
            {currentStep ? `Étape ${currentStep.order} sur ${totalSteps || 15}` : "Votre prochaine étape"}
          </span>
          <strong id="current-step-title">
            {currentStep?.title || dashboard.next_action}
          </strong>
          <p>
            {currentStep?.objective ||
              "Votre parcours sera personnalisé dès que les premières informations du dossier seront disponibles."}
          </p>

          {currentStep?.next_action ? (
            <div className="student-cockpit-next">
              <small>À faire maintenant</small>
              <p>{currentStep.next_action}</p>
            </div>
          ) : null}
        </div>

        <div className="student-next-action-ctas">
          <ActionLink href={primaryTarget} variant="gold">
            Continuer cette étape
          </ActionLink>
          <AssistantGenieTrigger
            className="btn btn-outline"
            message={currentStep ? `Explique-moi clairement pourquoi je suis à l'étape « ${currentStep.title} », ce qui me bloque et ce que je dois faire maintenant.` : "Explique-moi où j'en suis dans mon parcours PieAgency et ce que je dois faire maintenant."}
            requestedAction="copilot_explain_current_step"
          >
            Demander à Assistant.genie
          </AssistantGenieTrigger>
          <ActionLink href="/espace-etudiant/parcours-guide" variant="outline">
            Voir le parcours complet
          </ActionLink>
        </div>
      </section>

      <div className="portal-grid student-cockpit-grid">
        <section className="portal-card" aria-labelledby="requirements-title">
          <div className="portal-card-head">
            <div>
              <div className="portal-card-kicker">Critères de validation</div>
              <h3 id="requirements-title">Ce qu&apos;il faut valider maintenant</h3>
            </div>
            <div className="portal-progress-meta">
              {satisfiedRequired}/{requiredItems.length} prêt{requiredItems.length > 1 ? "s" : ""}
            </div>
          </div>

          {requiredItems.length ? (
            <div className="student-cockpit-requirements">
              {requiredItems.map((requirement) => (
                <div
                  className={`student-cockpit-requirement ${requirement.satisfied ? "is-ready" : "is-blocked"}`}
                  key={requirement.key}
                >
                  <span aria-hidden="true">{requirement.satisfied ? "✓" : "•"}</span>
                  <div>
                    <strong>{requirement.label}</strong>
                    <small>
                      {requirement.satisfied
                        ? "Validé"
                        : requirement.source === "automatic"
                          ? "PieAgency attend une preuve dans votre dossier"
                          : "À confirmer lorsque c'est réellement prêt"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="portal-empty">
              Les critères détaillés apparaîtront dès que votre parcours sera initialisé.
            </div>
          )}

          {currentStep?.blocking_reasons.length ? (
            <div className="student-cockpit-blockers">
              <strong>Ce qui bloque la suite</strong>
              <ul>
                {currentStep.blocking_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : currentStep ? (
            <div className="student-cockpit-ready">
              Les critères nécessaires sont satisfaits. Cette étape peut être validée.
            </div>
          ) : null}
        </section>

        <div className="portal-stack">
          <section className="portal-card" aria-labelledby="next-step-title">
            <div className="portal-card-kicker">Après cette étape</div>
            <h3 id="next-step-title">Ce qui vient ensuite</h3>
            {followingStep ? (
              <>
                <strong className="student-cockpit-next-title">
                  {followingStep.title}
                </strong>
                <p>{followingStep.objective || followingStep.short_description}</p>
                <small className="student-cockpit-muted">
                  Cette étape se débloquera lorsque l&apos;étape actuelle sera réellement validée.
                </small>
              </>
            ) : (
              <p>Vous êtes sur la dernière étape de votre parcours actuel.</p>
            )}
          </section>

          <section className="portal-card" aria-labelledby="documents-title">
            <div className="portal-card-head">
              <div>
                <div className="portal-card-kicker">Documents</div>
                <h3 id="documents-title">État du dossier</h3>
              </div>
              <ActionLink href="/espace-etudiant/documents" variant="outline">
                Ouvrir
              </ActionLink>
            </div>
            <div className="student-cockpit-document-summary">
              <div>
                <strong>{dashboard.documents.length}</strong>
                <span>pièce{dashboard.documents.length > 1 ? "s" : ""}</span>
              </div>
              <div>
                <strong>{missingDocuments.length}</strong>
                <span>manquante{missingDocuments.length > 1 ? "s" : ""}</span>
              </div>
              <div>
                <strong>{reviewDocuments.length}</strong>
                <span>en revue</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showProductPromotion && productPromotion ? (
        <section className="cockpit-product-promo" aria-labelledby="cockpit-product-promo-title">
          <div className="cockpit-product-promo-main">
            <div className="cockpit-product-promo-kicker">Suggestion utile maintenant · facultative</div>
            <h3 id="cockpit-product-promo-title">{productPromotion.title}</h3>
            <p>{productPromotion.description}</p>
            {productPromotion.reason_now ? (
              <div className="cockpit-product-promo-reason">
                <small>Pourquoi maintenant</small>
                <span>{productPromotion.reason_now}</span>
              </div>
            ) : null}
            {productPromotion.expected_outcome ? (
              <div className="cockpit-product-promo-reason">
                <small>Ce que cela peut vous aider à obtenir</small>
                <span>{productPromotion.expected_outcome}</span>
              </div>
            ) : null}
          </div>
          <div className="cockpit-product-promo-actions">
            <ActionLink href={productPromotion.target_path} variant="gold">
              Voir le produit
            </ActionLink>
            <AssistantGenieTrigger
              className="btn btn-outline"
              message={`Le produit « ${productPromotion.title} » m'est recommandé pour mon étape actuelle. Dis-moi objectivement s'il peut vraiment m'aider maintenant. Si je peux avancer sans l'acheter, dis-le clairement.`}
              requestedAction="evaluate_contextual_product"
            >
              Demander à Assistant.genie
            </AssistantGenieTrigger>
            <button className="cockpit-product-promo-dismiss" onClick={dismissProductPromotion} type="button">
              Plus tard
            </button>
          </div>
        </section>
      ) : null}

      <section className="portal-card" aria-labelledby="advisor-title">
        <div className="portal-card-head">
          <div>
            <div className="portal-card-kicker">Suivi PieAgency</div>
            <h3 id="advisor-title">Votre accompagnement</h3>
          </div>
          <div className="portal-progress-meta">
            Conseiller : {dashboard.assigned_counselor}
          </div>
        </div>

        {dashboard.notes.length ? (
          <div className="portal-note-list">
            {dashboard.notes.slice(0, 2).map((note) => (
              <div className="portal-note" key={`${note.title}-${note.created_at_label}`}>
                <div className="portal-note-head">
                  <strong>{note.title}</strong>
                  <span>{note.created_at_label}</span>
                </div>
                <p>{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="portal-empty">
            Aucun commentaire conseiller n&apos;est disponible pour le moment.
          </div>
        )}
      </section>
    </div>
  );
}
