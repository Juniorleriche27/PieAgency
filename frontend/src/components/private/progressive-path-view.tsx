"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Lock,
  MessageCircle,
  Package,
  Play,
  RotateCcw,
  ShoppingBag,
  Zap,
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
  type StepStatus,
} from "@/lib/progressive-path";

// ─── Phase tunnel ────────────────────────────────────────────────────────────

type PhaseStatus = "done" | "active" | "todo" | "blocked";

const PHASES: { id: string; label: string; short: string; stepOrders: number[] }[] = [
  { id: "profile",     label: "Profil",                short: "Profil",        stepOrders: [1, 2] },
  { id: "diagnostic",  label: "Diagnostic",            short: "Diagnostic",    stepOrders: [3] },
  { id: "formations",  label: "Choix des formations",  short: "Formations",    stepOrders: [4, 5] },
  { id: "preparation", label: "Préparation du dossier",short: "Dossier",       stepOrders: [6, 7, 8, 9] },
  { id: "depot",       label: "Dépôt officiel",        short: "Dépôt",         stepOrders: [10, 11] },
  { id: "entretien",   label: "Entretien",             short: "Entretien",     stepOrders: [12] },
  { id: "admission",   label: "Admission & Visa",      short: "Visa",          stepOrders: [13, 14] },
  { id: "depart",      label: "Départ",                short: "Départ",        stepOrders: [15] },
];

function phaseStatus(steps: ProgressiveStep[], orders: number[]): PhaseStatus {
  const phaseSteps = steps.filter((s) => orders.includes(s.order));
  if (phaseSteps.length === 0) return "todo";
  if (phaseSteps.every((s) => s.status === "completed")) return "done";
  if (phaseSteps.some((s) => s.status === "blocked")) return "blocked";
  if (phaseSteps.some((s) => s.is_current || s.status === "in_progress")) return "active";
  return "todo";
}

function currentPhaseIndex(steps: ProgressiveStep[]): number {
  return PHASES.findIndex((ph) => phaseStatus(steps, ph.stepOrders) === "active");
}

function PhaseTunnel({ steps }: { steps: ProgressiveStep[] }) {
  const activeIdx = currentPhaseIndex(steps);
  return (
    <div className="pp-phases-wrap">
      <div className="pp-phases">
        {PHASES.map((phase, idx) => {
          const status = phaseStatus(steps, phase.stepOrders);
          return (
            <div className="pp-phase-slot" key={phase.id}>
              {idx > 0 && <div className={`pp-phase-line${status === "done" || idx <= activeIdx ? " pp-phase-line-done" : ""}`} />}
              <div className={`pp-phase-item pp-phase-${status}`}>
                <div className="pp-phase-dot">
                  {status === "done" ? <CheckCircle2 size={13} /> : status === "active" ? <Zap size={12} /> : status === "blocked" ? <AlertCircle size={12} /> : <span>{idx + 1}</span>}
                </div>
                <span className="pp-phase-label">{phase.short}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pp-phase-full-label">
        {activeIdx >= 0 ? (
          <span>Phase actuelle : <strong>{PHASES[activeIdx]?.label}</strong></span>
        ) : null}
      </div>
    </div>
  );
}

// ─── Next step zone ───────────────────────────────────────────────────────────

function whatToDoList(step: ProgressiveStep): string[] {
  const lines: string[] = [];
  if (step.target_module) lines.push(`Ouvrir le module "${step.target_module}".`);
  if (step.short_description) lines.push(step.short_description);
  lines.push("Effectuez l'action demandée.");
  lines.push("Revenez ici pour valider l'étape.");
  return lines;
}

function NextStepZone({
  step,
  actionLoading,
  onStart,
  onComplete,
  onReopen,
}: {
  step: ProgressiveStep;
  actionLoading: boolean;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const todos = whatToDoList(step);

  return (
    <section className="pp-next-step">
      <div className="pp-next-step-header">
        <div>
          <span className="pp-next-step-kicker">Votre prochaine étape</span>
          <h2 className="pp-next-step-title">{step.title}</h2>
          {step.short_description ? (
            <p className="pp-next-step-objective">
              <strong>Objectif :</strong> {step.short_description}
            </p>
          ) : null}
        </div>
        <span className={`pp-step-status-chip pp-chip-${step.status}`}>
          {stepStatusLabel(step.status)}
        </span>
      </div>

      <div className="pp-next-step-todo">
        <p className="pp-next-step-todo-label">Ce que vous devez faire :</p>
        <ol>
          {todos.map((line, i) => <li key={i}>{line}</li>)}
        </ol>
      </div>

      <div className="pp-next-step-actions">
        {step.target_path ? (
          <Link className="btn btn-primary pp-next-btn" href={step.target_path}>
            {step.target_module ? `Ouvrir ${step.target_module}` : "Ouvrir le module"}
            <ExternalLink size={14} />
          </Link>
        ) : null}
        <Link className="btn btn-ghost pp-next-btn" href="/espace-etudiant/assistant">
          <MessageCircle size={14} /> Poser une question à l&apos;assistant
        </Link>
        {step.status === "not_started" && !step.is_locked ? (
          <button
            className="btn btn-outline pp-next-btn"
            disabled={actionLoading}
            onClick={() => onStart(step.id)}
            type="button"
          >
            <Play size={14} /> Commencer cette étape
          </button>
        ) : step.status === "in_progress" ? (
          <button
            className="btn btn-success pp-next-btn"
            disabled={actionLoading}
            onClick={() => onComplete(step.id)}
            type="button"
          >
            <CheckCircle2 size={14} /> J&apos;ai terminé cette étape
          </button>
        ) : step.status === "completed" ? (
          <button
            className="btn btn-ghost pp-next-btn"
            disabled={actionLoading}
            onClick={() => onReopen(step.id)}
            type="button"
          >
            <RotateCcw size={14} /> Rouvrir cette étape
          </button>
        ) : null}
      </div>
    </section>
  );
}

// ─── Options pour avancer ─────────────────────────────────────────────────────

function OptionCard({
  icon,
  title,
  body,
  href,
  btnLabel,
  badge,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  href: string;
  btnLabel: string;
  badge?: ReactNode;
}) {
  return (
    <div className="pp-option-card">
      <div className="pp-option-icon">{icon}</div>
      <div className="pp-option-body">
        {badge ? <div className="pp-option-badge">{badge}</div> : null}
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <Link className="btn btn-outline pp-option-btn" href={href}>
        {btnLabel} <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function OptionsSection({ recommendations }: { recommendations: ProgressivePath["recommendations"] }) {
  const { free_action, recommended_product, assistant_action } = recommendations;
  if (!free_action && !recommended_product && !assistant_action) return null;

  return (
    <section className="pp-options">
      <h2 className="pp-section-title">Vos options pour avancer</h2>
      <div className="pp-options-grid">
        {free_action ? (
          <OptionCard
            icon={<BookOpen size={20} />}
            title="Continuer seul"
            body="Vous pouvez avancer seul avec les ressources gratuites disponibles pour cette étape."
            href={free_action.target_path}
            btnLabel="Continuer avec la ressource"
          />
        ) : null}
        {recommended_product ? (
          <OptionCard
            icon={<Package size={20} />}
            title="Utiliser un outil PieAgency"
            body="Pour aller plus loin, vous pouvez utiliser un produit digital conçu pour cette étape."
            href={recommended_product.target_path}
            btnLabel="Voir le produit recommandé"
            badge={recommended_product.requires_purchase ? (
              <span className="pp-rec-paid"><ShoppingBag size={11} /> Payant</span>
            ) : <span className="pp-rec-free">Inclus</span>}
          />
        ) : null}
        {assistant_action ? (
          <OptionCard
            icon={<MessageCircle size={20} />}
            title="Demander de l'aide"
            body="Vous pouvez poser une question à l'assistant dossier ou demander une aide PieAgency."
            href={assistant_action.target_path}
            btnLabel="Ouvrir l'assistant dossier"
          />
        ) : null}
      </div>
    </section>
  );
}

// ─── Modules liés ─────────────────────────────────────────────────────────────

function ModuleCard({
  icon,
  title,
  desc,
  href,
  label,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  href: string;
  label: string;
}) {
  return (
    <Link className="pp-module-card" href={href}>
      <div className="pp-module-icon">{icon}</div>
      <div className="pp-module-body">
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
      <span className="pp-module-cta">{label} <ArrowRight size={13} /></span>
    </Link>
  );
}

function RelatedModules({
  step,
  recommendations,
}: {
  step: ProgressiveStep | null;
  recommendations: ProgressivePath["recommendations"];
}) {
  const modules: { icon: ReactNode; title: string; desc: string; href: string; label: string }[] = [];

  if (step?.target_path && step.target_module) {
    modules.push({
      icon: <Zap size={18} />,
      title: step.target_module,
      desc: "Module principal pour cette étape.",
      href: step.target_path,
      label: `Ouvrir ${step.target_module}`,
    });
  }

  if (recommendations.free_action) {
    modules.push({
      icon: <BookOpen size={18} />,
      title: recommendations.free_action.title,
      desc: recommendations.free_action.description,
      href: recommendations.free_action.target_path,
      label: "Accéder à la ressource",
    });
  }

  if (recommendations.document_action) {
    modules.push({
      icon: <FileText size={18} />,
      title: "Mes documents",
      desc: recommendations.document_action.description || "Préparez ou vérifiez les pièces liées à cette étape.",
      href: recommendations.document_action.target_path,
      label: "Ouvrir Mes documents",
    });
  }

  if (recommendations.assistant_action) {
    modules.push({
      icon: <MessageCircle size={18} />,
      title: "Assistant dossier",
      desc: "Posez vos questions sur cette étape.",
      href: recommendations.assistant_action.target_path,
      label: "Ouvrir l'assistant",
    });
  }

  if (modules.length === 0) return null;

  return (
    <section className="pp-modules">
      <h2 className="pp-section-title">Modules liés à cette étape</h2>
      <div className="pp-modules-grid">
        {modules.map((m, i) => <ModuleCard key={i} {...m} />)}
      </div>
    </section>
  );
}

// ─── Timeline secondaire ──────────────────────────────────────────────────────

function stepStatusLabel(status: StepStatus): string {
  switch (status) {
    case "completed":   return "Terminé";
    case "in_progress": return "En cours";
    case "needs_review":return "En révision";
    case "blocked":     return "Bloqué";
    default:            return "À faire";
  }
}

function StepDot({ status, isLocked }: { status: StepStatus; isLocked: boolean }) {
  if (isLocked) return <Lock size={12} className="pp-ti-icon pp-ti-locked" />;
  switch (status) {
    case "completed":    return <CheckCircle2 size={12} className="pp-ti-icon pp-ti-done" />;
    case "in_progress":  return <Play size={12} className="pp-ti-icon pp-ti-active" />;
    case "needs_review": return <Clock size={12} className="pp-ti-icon pp-ti-review" />;
    case "blocked":      return <AlertCircle size={12} className="pp-ti-icon pp-ti-blocked" />;
    default:             return <div className="pp-ti-dot" />;
  }
}

function TimelinePanel({ steps }: { steps: ProgressiveStep[] }) {
  const [open, setOpen] = useState(false);
  const done = steps.filter((s) => s.status === "completed").length;

  return (
    <aside className="pp-timeline-panel">
      <button
        className="pp-timeline-toggle"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span>Les {steps.length} étapes — {done}/{steps.length} terminées</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open ? (
        <ol className="pp-timeline">
          {steps.map((step) => (
            <li
              className={`pp-ti-item${step.is_current ? " pp-ti-current" : ""}${step.status === "completed" ? " pp-ti-done-item" : ""}${step.is_locked ? " pp-ti-locked-item" : ""}`}
              key={step.id}
            >
              <div className="pp-ti-marker">
                <StepDot isLocked={step.is_locked} status={step.status} />
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
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </aside>
  );
}

// ─── Dépôt officiel ───────────────────────────────────────────────────────────

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

// ─── Main view ────────────────────────────────────────────────────────────────

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

  const handleStart    = (id: string) => runAction(() => startStep(id));
  const handleComplete = (id: string) => runAction(() => completeStep(id));
  const handleReopen   = (id: string) => runAction(() => reopenStep(id));
  const handleDeposit  = (body: OfficialDepositBody) => runAction(() => declareOfficialDeposit(body));

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

  if (!Array.isArray(steps) || !recommendations || !official_deposit) {
    return (
      <div className="pp-page">
        <div className="portal-warning">Parcours en cours de préparation par votre conseiller.</div>
      </div>
    );
  }

  const showDepositBlock =
    current_step &&
    (current_step.id === "mark-official-filing-done" ||
      current_step.id === "track-after-official-filing");

  return (
    <div className="pp-page">
      {/* Header */}
      <section className="pp-hero">
        <div className="pp-hero-text">
          <span className="pp-hero-kicker">Mon Copilote</span>
          <h1>Mon parcours guidé</h1>
          <p>Avancez étape par étape avec les bons modules, les bonnes ressources, et les bonnes actions.</p>
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

      {/* Phase tunnel */}
      <PhaseTunnel steps={steps} />

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      {/* Next step */}
      {current_step ? (
        <NextStepZone
          step={current_step}
          actionLoading={actionLoading}
          onStart={handleStart}
          onComplete={handleComplete}
          onReopen={handleReopen}
        />
      ) : (
        <div className="pp-next-step pp-next-step-done">
          <CheckCircle2 size={32} />
          <h2>Toutes vos étapes sont terminées !</h2>
          <p>Félicitations pour votre parcours. Continuez à suivre votre dossier.</p>
        </div>
      )}

      {/* Options */}
      <OptionsSection recommendations={recommendations} />

      {/* Related modules */}
      <RelatedModules step={current_step} recommendations={recommendations} />

      {/* Official deposit */}
      {(showDepositBlock || official_deposit.has_declared) ? (
        <OfficialDepositBlock
          deposit={official_deposit}
          loading={actionLoading}
          onDeclare={handleDeposit}
        />
      ) : null}

      {/* Secondary timeline */}
      <TimelinePanel steps={steps} />
    </div>
  );
}
