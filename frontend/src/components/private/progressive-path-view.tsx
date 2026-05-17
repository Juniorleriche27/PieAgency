"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  MessageCircle,
  Package,
  Play,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  completeStep,
  declareOfficialDeposit,
  fetchProgressivePath,
  reopenStep,
  startStep,
  type OfficialDeposit,
  type OfficialDepositBody,
  type OfficialDepositStatus,
  type PlatformType,
  type ProgressivePath,
  type ProgressiveStep,
  type RecommendationAction,
  type RecommendedProduct,
  type StepStatus,
} from "@/lib/progressive-path";

function stepStatusLabel(status: StepStatus): string {
  switch (status) {
    case "completed": return "Terminé";
    case "in_progress": return "En cours";
    case "needs_review": return "En révision";
    case "blocked": return "Bloqué";
    default: return "À démarrer";
  }
}

function StepIcon({ status, isLocked }: { status: StepStatus; isLocked: boolean }) {
  if (isLocked) return <Lock size={14} className="pp-ti-icon pp-ti-locked" />;
  switch (status) {
    case "completed": return <CheckCircle2 size={14} className="pp-ti-icon pp-ti-done" />;
    case "in_progress": return <Play size={14} className="pp-ti-icon pp-ti-active" />;
    case "needs_review": return <Clock size={14} className="pp-ti-icon pp-ti-review" />;
    case "blocked": return <AlertCircle size={14} className="pp-ti-icon pp-ti-blocked" />;
    default: return <div className="pp-ti-dot" />;
  }
}

function RecommendationCard({
  action,
  icon,
  label,
}: {
  action: RecommendationAction | null;
  icon: ReactNode;
  label: string;
}) {
  if (!action) return null;
  return (
    <Link className="pp-rec-item" href={action.target_path}>
      <div className="pp-rec-item-icon">{icon}</div>
      <div className="pp-rec-item-body">
        <span className="pp-rec-item-label">{label}</span>
        <strong>{action.title}</strong>
        <p>{action.description}</p>
      </div>
      <ChevronRight size={16} className="pp-rec-item-arrow" />
    </Link>
  );
}

const PLATFORM_LABELS: Record<PlatformType, string> = {
  campus_france: "Campus France",
  private_school: "École privée",
  parcoursup: "Parcoursup",
  belgium: "Belgique",
  visa: "Service visa officiel",
  other: "Autre",
};

const DEPOSIT_STATUS_LABELS: Record<OfficialDepositStatus, string> = {
  declared: "Déclaré",
  under_review: "En cours de traitement",
  accepted: "Accepté",
  refused: "Refusé",
  waiting: "En attente",
  other: "Autre",
};

const EMPTY_DEPOSIT_FORM: OfficialDepositBody = {
  platform_type: "campus_france",
  platform_name: "",
  official_deposit_date: "",
  official_reference: "",
  status: "declared",
  comment: "",
};

function OfficialDepositBlock({
  deposit,
  onDeclare,
  loading,
}: {
  deposit: OfficialDeposit;
  onDeclare: (body: OfficialDepositBody) => Promise<void>;
  loading: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OfficialDepositBody>(EMPTY_DEPOSIT_FORM);

  function set<K extends keyof OfficialDepositBody>(key: K, value: OfficialDepositBody[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    await onDeclare(form);
    setShowForm(false);
  }

  return (
    <section className="pp-deposit">
      <div className="pp-deposit-notice">
        <AlertCircle size={16} />
        <p>
          PieAgency vous aide à préparer, vérifier et suivre votre procédure. Le dépôt officiel se
          fait uniquement sur la plateforme concernée : Campus France, école privée, Parcoursup,
          Belgique ou service visa officiel.
        </p>
      </div>

      {deposit.has_declared ? (
        <div className="pp-deposit-declared">
          <div className="pp-deposit-declared-head">
            <CheckCircle2 size={16} />
            <strong>Dépôt officiel déclaré</strong>
          </div>
          <dl className="pp-deposit-details">
            {deposit.platform_name ? (
              <div><dt>Plateforme</dt><dd>{deposit.platform_name}</dd></div>
            ) : null}
            {deposit.official_deposit_date ? (
              <div><dt>Date</dt><dd>{deposit.official_deposit_date}</dd></div>
            ) : null}
            {deposit.official_reference ? (
              <div><dt>Référence</dt><dd>{deposit.official_reference}</dd></div>
            ) : null}
            {deposit.status ? (
              <div><dt>Statut</dt><dd>{DEPOSIT_STATUS_LABELS[deposit.status]}</dd></div>
            ) : null}
          </dl>
          <button className="btn btn-ghost" onClick={() => setShowForm(true)} type="button">
            Mettre à jour
          </button>
        </div>
      ) : (
        <button
          className="btn btn-primary pp-deposit-cta"
          onClick={() => setShowForm(true)}
          type="button"
        >
          Renseigner la date du dépôt officiel
        </button>
      )}

      {showForm ? (
        <div className="pp-deposit-form">
          <h3>Déclarer le dépôt officiel externe</h3>
          <div className="crud-field">
            <label>Plateforme officielle</label>
            <select
              onChange={(e) => set("platform_type", e.target.value as PlatformType)}
              value={form.platform_type}
            >
              {(Object.entries(PLATFORM_LABELS) as [PlatformType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="crud-field">
            <label>Nom de la plateforme / établissement</label>
            <input
              onChange={(e) => set("platform_name", e.target.value)}
              placeholder="Ex : Campus France Sénégal"
              type="text"
              value={form.platform_name}
            />
          </div>
          <div className="crud-field-row">
            <div className="crud-field">
              <label>Date du dépôt officiel</label>
              <input
                onChange={(e) => set("official_deposit_date", e.target.value)}
                type="date"
                value={form.official_deposit_date}
              />
            </div>
            <div className="crud-field">
              <label>Référence du dossier officiel</label>
              <input
                onChange={(e) => set("official_reference", e.target.value)}
                placeholder="Ex : CF-2026-001"
                type="text"
                value={form.official_reference}
              />
            </div>
          </div>
          <div className="crud-field">
            <label>Statut du suivi</label>
            <select
              onChange={(e) => set("status", e.target.value as OfficialDepositStatus)}
              value={form.status}
            >
              {(Object.entries(DEPOSIT_STATUS_LABELS) as [OfficialDepositStatus, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="crud-field">
            <label>Commentaire (optionnel)</label>
            <textarea
              onChange={(e) => set("comment", e.target.value)}
              placeholder="Notes sur le suivi..."
              rows={3}
              value={form.comment}
            />
          </div>
          <div className="pp-deposit-form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)} type="button">
              Annuler
            </button>
            <button
              className="btn btn-primary"
              disabled={loading || !form.platform_name.trim() || !form.official_deposit_date}
              onClick={() => void handleSubmit()}
              type="button"
            >
              {loading ? "Enregistrement…" : "Enregistrer la déclaration de suivi"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ProgressivePathView() {
  const [data, setData] = useState<ProgressivePath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const result = await fetchProgressivePath();
        if (active) setData(result);
      } catch (err) {
        if (active)
          setErrorMessage(err instanceof Error ? err.message : "Impossible de charger le parcours.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function runAction(fn: () => Promise<ProgressivePath | null>) {
    setActionLoading(true);
    try {
      const result = await fn();
      if (result) setData(result);
      else setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleStart(stepId: string) {
    return runAction(() => startStep(stepId));
  }

  function handleComplete(stepId: string) {
    return runAction(() => completeStep(stepId));
  }

  function handleReopen(stepId: string) {
    return runAction(() => reopenStep(stepId));
  }

  function handleDeposit(body: OfficialDepositBody) {
    return runAction(() => declareOfficialDeposit(body));
  }

  function primaryButton(step: ProgressiveStep) {
    if (step.is_locked) return null;
    if (step.status === "not_started") {
      return (
        <button
          className="btn btn-primary pp-step-btn"
          disabled={actionLoading}
          onClick={() => void handleStart(step.id)}
          type="button"
        >
          <Play size={15} /> Démarrer
        </button>
      );
    }
    if (step.status === "in_progress") {
      return (
        <button
          className="btn btn-primary pp-step-btn"
          disabled={actionLoading}
          onClick={() => void handleComplete(step.id)}
          type="button"
        >
          <CheckCircle2 size={15} /> Marquer comme fait
        </button>
      );
    }
    if (step.status === "completed") {
      return (
        <button
          className="btn btn-ghost pp-step-btn"
          disabled={actionLoading}
          onClick={() => void handleReopen(step.id)}
          type="button"
        >
          <RotateCcw size={15} /> Rouvrir
        </button>
      );
    }
    if (step.status === "needs_review") {
      return (
        <span className="pp-step-badge pp-badge-review">
          <Clock size={13} /> En révision
        </span>
      );
    }
    if (step.status === "blocked") {
      return (
        <span className="pp-step-badge pp-badge-blocked">
          <AlertCircle size={13} /> Étape bloquée
        </span>
      );
    }
    return null;
  }

  const showDepositBlock =
    data &&
    data.current_step &&
    (data.current_step.id === "mark-official-filing-done" ||
      data.current_step.id === "track-after-official-filing");

  if (isLoading) {
    return (
      <div className="pp-page">
        <div className="pp-skeleton-hero" />
        <div className="pp-skeleton-grid">
          {Array.from({ length: 3 }).map((_, i) => <div className="pp-skeleton-card" key={i} />)}
        </div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="pp-page">
        <div className="portal-warning">{errorMessage || "Parcours non disponible."}</div>
      </div>
    );
  }

  const { current_step, progress_percent, steps, official_deposit, recommendations } = data;

  if (!Array.isArray(steps)) {
    return (
      <div className="pp-page">
        <div className="portal-warning">Parcours en cours de préparation par votre conseiller.</div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      {/* Hero */}
      <section className="pp-hero">
        <div className="pp-hero-text">
          <span className="pp-hero-kicker">Espace candidat</span>
          <h1>Mon parcours guidé</h1>
          <p>Avancez dans votre procédure étape par étape, avec les bonnes ressources au bon moment.</p>
        </div>
        <div className="pp-progress-wrap">
          <div className="pp-progress-label">
            <span>Progression globale</span>
            <strong>{progress_percent}%</strong>
          </div>
          <div className="pp-progress-bar">
            <div className="pp-progress-fill" style={{ width: `${progress_percent}%` }} />
          </div>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <div className="pp-layout">
        {/* Left column */}
        <div className="pp-left">
          {/* Current step */}
          {current_step ? (
            <section className="pp-card pp-card-current">
              <div className="pp-card-head">
                <span className="pp-card-kicker">Étape actuelle</span>
                <span className={`pp-step-status-chip pp-chip-${current_step.status}`}>
                  {stepStatusLabel(current_step.status)}
                </span>
              </div>
              <h2 className="pp-card-title">{current_step.title}</h2>
              <p className="pp-card-desc">{current_step.short_description}</p>
              <div className="pp-card-actions">
                {primaryButton(current_step)}
                {current_step.target_path ? (
                  <Link className="btn btn-ghost pp-step-btn" href={current_step.target_path}>
                    Voir le module <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Recommendations */}
          {(recommendations.free_action ||
            recommendations.recommended_product ||
            recommendations.assistant_action ||
            recommendations.document_action) ? (
            <section className="pp-card pp-card-recs">
              <div className="pp-card-head">
                <span className="pp-card-kicker">Ressources recommandées</span>
              </div>
              <div className="pp-rec-list">
                <RecommendationCard
                  action={recommendations.free_action}
                  icon={<BookOpen size={16} />}
                  label="Action gratuite"
                />
                {recommendations.recommended_product ? (
                  <Link className="pp-rec-item pp-rec-product" href={recommendations.recommended_product.target_path}>
                    <div className="pp-rec-item-icon"><Package size={16} /></div>
                    <div className="pp-rec-item-body">
                      <span className="pp-rec-item-label">
                        Produit recommandé
                        {recommendations.recommended_product.requires_purchase ? (
                          <span className="pp-rec-paid"><ShoppingBag size={11} /> Payant</span>
                        ) : null}
                      </span>
                      <strong>{recommendations.recommended_product.title}</strong>
                      <p>{recommendations.recommended_product.description}</p>
                    </div>
                    <ChevronRight size={16} className="pp-rec-item-arrow" />
                  </Link>
                ) : null}
                <RecommendationCard
                  action={recommendations.assistant_action}
                  icon={<MessageCircle size={16} />}
                  label="Assistant dossier"
                />
                <RecommendationCard
                  action={recommendations.document_action}
                  icon={<FileText size={16} />}
                  label="Document lié"
                />
              </div>
            </section>
          ) : null}

          {/* Official deposit */}
          {showDepositBlock ? (
            <OfficialDepositBlock
              deposit={official_deposit}
              loading={actionLoading}
              onDeclare={handleDeposit}
            />
          ) : official_deposit.has_declared ? (
            <OfficialDepositBlock
              deposit={official_deposit}
              loading={actionLoading}
              onDeclare={handleDeposit}
            />
          ) : null}
        </div>

        {/* Right column — Timeline */}
        <aside className="pp-right">
          <section className="pp-card pp-timeline-card">
            <div className="pp-card-head">
              <span className="pp-card-kicker">Les 15 étapes</span>
            </div>
            <ol className="pp-timeline">
              {steps.map((step) => (
                <li
                  className={`pp-ti-item${step.is_current ? " pp-ti-current" : ""}${step.status === "completed" ? " pp-ti-done-item" : ""}${step.is_locked ? " pp-ti-locked-item" : ""}`}
                  key={step.id}
                >
                  <div className="pp-ti-marker">
                    <StepIcon isLocked={step.is_locked} status={step.status} />
                  </div>
                  <div className="pp-ti-body">
                    <div className="pp-ti-title">
                      <span>{step.title}</span>
                      {step.status === "completed" ? (
                        <span className="pp-ti-badge pp-ti-badge-done">Terminé</span>
                      ) : step.is_current ? (
                        <span className="pp-ti-badge pp-ti-badge-current">En cours</span>
                      ) : null}
                    </div>
                    {step.is_current && step.short_description ? (
                      <p className="pp-ti-desc">{step.short_description}</p>
                    ) : null}
                    {step.is_current && !step.is_locked ? (
                      <div className="pp-ti-actions">
                        {primaryButton(step)}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
