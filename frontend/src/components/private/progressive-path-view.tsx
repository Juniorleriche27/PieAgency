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
  Info,
  Lock,
  MessageCircle,
  Package,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  completeStep,
  declareOfficialDeposit,
  fetchGuidance,
  fetchProgressivePath,
  reopenStep,
  startStep,
  type Guidance,
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
  { id: "profile",     label: "Profil",                 short: "Profil",         stepOrders: [1, 2] },
  { id: "diagnostic",  label: "Diagnostic",             short: "Diagnostic",     stepOrders: [3] },
  { id: "formations",  label: "Choix des formations",   short: "Formations",     stepOrders: [4, 5] },
  { id: "preparation", label: "Préparation du dossier", short: "Dossier",        stepOrders: [6, 7, 8, 9, 10] },
  { id: "depot",       label: "Dépôt officiel",         short: "Dépôt officiel", stepOrders: [11, 12] },
  { id: "entretien",   label: "Entretien",              short: "Entretien",      stepOrders: [13] },
  { id: "admission",   label: "Admission",              short: "Admission",      stepOrders: [14, 15] },
  { id: "visa",        label: "Visa",                   short: "Visa",           stepOrders: [16, 17, 18] },
  { id: "depart",      label: "Départ",                 short: "Départ",         stepOrders: [19] },
];

// step_id -> phase_id: authoritative mapping regardless of DB order
const STEP_PHASE_MAP: Record<string, string> = {
  "understand-profile":              "profile",
  "read-diagnostic":                 "diagnostic",
  "define-procedure-strategy":       "formations",
  "choose-formations":               "formations",
  "prepare-documents":               "preparation",
  "prepare-cv":                      "preparation",
  "prepare-study-project":           "preparation",
  "prepare-career-project":          "preparation",
  "prepare-motivation-letters":      "preparation",
  "verify-before-official-deposit":  "depot",
  "declare-official-deposit":        "depot",
  "mark-official-filing-done":       "depot",
  "track-after-official-filing":     "depot",
  "prepare-campus-france-interview": "entretien",
  "follow-admission":                "admission",
  "prepare-visa-file":               "visa",
  "declare-visa-deposit":            "visa",
  "follow-visa":                     "visa",
  "prepare-departure":               "depart",
};

function phaseStatus(steps: ProgressiveStep[], orders: number[]): PhaseStatus {
  const phaseSteps = steps.filter((s) => orders.includes(s.order));
  if (phaseSteps.length === 0) return "todo";
  if (phaseSteps.every((s) => s.status === "completed")) return "done";
  if (phaseSteps.some((s) => s.status === "blocked")) return "blocked";
  if (phaseSteps.some((s) => s.is_current || s.status === "in_progress")) return "active";
  return "todo";
}

function currentPhaseIndex(steps: ProgressiveStep[], guidancePhase?: string | null): number {
  // 1. Use step_id -> phase map for current step (most reliable)
  const currentStep = steps.find((s) => s.is_current);
  if (currentStep) {
    const mappedPhaseId = STEP_PHASE_MAP[currentStep.id];
    if (mappedPhaseId) {
      const idx = PHASES.findIndex((ph) => ph.id === mappedPhaseId);
      if (idx >= 0) return idx;
    }
  }
  // 2. Use guidance phase string as fallback
  if (guidancePhase) {
    const lower = guidancePhase.toLowerCase();
    const idx = PHASES.findIndex(
      (ph) => ph.id === lower || ph.label.toLowerCase() === lower || ph.short.toLowerCase() === lower,
    );
    if (idx >= 0) return idx;
  }
  // 3. Fall back to stepOrders-based detection
  return PHASES.findIndex((ph) => phaseStatus(steps, ph.stepOrders) === "active");
}

function PhaseTunnel({ steps, guidancePhase }: { steps: ProgressiveStep[]; guidancePhase?: string | null }) {
  const activeIdx = currentPhaseIndex(steps, guidancePhase);
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

function fallbackTodoList(step: ProgressiveStep): string[] {
  const lines: string[] = [];
  if (step.target_module) lines.push(`Ouvrir le module "${step.target_module}".`);
  if (step.short_description) lines.push(step.short_description);
  lines.push("Effectuez l'action demandée.");
  lines.push("Revenez ici pour valider l'étape.");
  return lines;
}

function appendCopilotParams(href: string, step: string): string {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}from=parcours-guide&step=${step}`;
}

function NextStepZone({
  step,
  guidance,
  actionLoading,
  onStart,
  onComplete,
  onReopen,
}: {
  step: ProgressiveStep;
  guidance: Guidance | null;
  actionLoading: boolean;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const title     = guidance?.title     ?? step.title;
  const objective = guidance?.objective ?? step.short_description;
  const phase     = guidance?.phase     ?? null;
  const todos     = (guidance?.what_to_do_now && guidance.what_to_do_now.length > 0)
    ? guidance.what_to_do_now
    : fallbackTodoList(step);

  const assistantHref = guidance?.current_step_id
    ? `/espace-etudiant/assistant?context=${guidance.current_step_id}&from=parcours-guide&step=open-assistant`
    : "/espace-etudiant/assistant?from=parcours-guide&step=open-assistant";

  return (
    <section className="pp-next-step">
      <div className="pp-next-step-header">
        <div>
          <span className="pp-next-step-kicker">
            {phase ? (
              <><Sparkles size={12} className="pp-kicker-spark" /> Phase : {phase}</>
            ) : "Votre prochaine étape"}
          </span>
          <h2 className="pp-next-step-title">{title}</h2>
          {objective ? (
            <p className="pp-next-step-objective">
              <strong>Objectif :</strong> {objective}
            </p>
          ) : null}
        </div>
        <span className={`pp-step-status-chip pp-chip-${step.status}`}>
          {stepStatusLabel(step.status)}
        </span>
      </div>

      <div className="pp-next-step-todo">
        <p className="pp-next-step-todo-label">Ce que vous devez faire maintenant</p>
        <ol>
          {todos.map((line, i) => <li key={i}>{line}</li>)}
        </ol>
      </div>

      <div className="pp-next-step-actions">
        {step.target_path ? (
          <Link
            className="btn btn-primary pp-next-btn"
            href={appendCopilotParams(step.target_path, step.id)}
          >
            {step.target_module ? `Ouvrir ${step.target_module}` : "Ouvrir cette étape"}
            <ExternalLink size={14} />
          </Link>
        ) : null}
        {(step.status === "not_started" || step.status === "in_progress") && !step.is_locked ? (
          <button
            className="btn btn-success pp-next-btn"
            disabled={actionLoading}
            onClick={() => step.status === "not_started" ? onStart(step.id) : onComplete(step.id)}
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
        <Link className="btn btn-ghost pp-next-btn" href={assistantHref}>
          <MessageCircle size={14} /> Poser une question à l&apos;assistant
        </Link>
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

function OptionsSection({
  guidance,
  recommendations,
}: {
  guidance: Guidance | null;
  recommendations: ProgressivePath["recommendations"];
}) {
  // Guidance is the primary source; fallback to recommendations if guidance absent
  const freeTitle  = guidance?.free_option?.title       ?? "Continuer seul";
  const freeBody   = guidance?.free_option?.description ?? "Vous pouvez avancer seul avec les ressources gratuites disponibles pour cette étape.";
  const freeHref   = appendCopilotParams(guidance?.free_option?.target_path ?? recommendations.free_action?.target_path ?? "/espace-etudiant/ressources", "visit-resources");

  const hasFreeSrc = guidance?.free_option ?? recommendations.free_action;

  const paidTitle  = guidance?.paid_option?.title       ?? "Utiliser un outil PieAgency";
  const paidBody   = guidance?.paid_option?.description ?? "Pour aller plus loin, utilisez un produit digital conçu pour cette étape.";
  const paidHref   = appendCopilotParams(guidance?.paid_option?.target_path ?? recommendations.recommended_product?.target_path ?? "/espace-etudiant/produits", "visit-products");

  const hasPaidSrc = guidance?.paid_option ?? recommendations.recommended_product;

  const assistantStepId = guidance?.current_step_id;
  const assistantHref   = assistantStepId
    ? `/espace-etudiant/assistant?context=${assistantStepId}&from=parcours-guide&step=open-assistant`
    : appendCopilotParams(guidance?.assistant_suggestion?.target_path ?? recommendations.assistant_action?.target_path ?? "/espace-etudiant/assistant", "open-assistant");
  const assistantBody   = guidance?.assistant_suggestion?.message
    ?? "Posez vos questions sur cette étape à l'assistant dossier.";

  const hasAssistantSrc = guidance?.assistant_suggestion ?? recommendations.assistant_action;

  if (!hasFreeSrc && !hasPaidSrc && !hasAssistantSrc) return null;

  return (
    <section className="pp-options">
      <h2 className="pp-section-title">Vos options pour avancer</h2>
      <div className="pp-options-grid">
        {hasFreeSrc ? (
          <OptionCard
            icon={<BookOpen size={20} />}
            title={freeTitle}
            body={freeBody}
            href={freeHref}
            btnLabel="Continuer seul"
          />
        ) : null}
        {hasPaidSrc ? (
          <OptionCard
            icon={<Package size={20} />}
            title={paidTitle}
            body={paidBody}
            href={paidHref}
            btnLabel="Voir l'outil recommandé"
            badge={<span className="pp-rec-paid"><ShoppingBag size={11} /> Recommandé</span>}
          />
        ) : null}
        {hasAssistantSrc ? (
          <OptionCard
            icon={<MessageCircle size={20} />}
            title="Demander de l'aide"
            body={assistantBody}
            href={assistantHref}
            btnLabel="Ouvrir l'assistant dossier"
          />
        ) : null}
      </div>
    </section>
  );
}

// ─── Avertissement officiel ───────────────────────────────────────────────────

function OfficialWarningBlock({ text }: { text: string }) {
  return (
    <div className="pp-official-warning">
      <Info size={18} className="pp-official-warning-icon" />
      <p>{text}</p>
    </div>
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

// ─── Loading screen ───────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Analyse de votre profil en cours…",
  "Chargement de vos étapes personnalisées…",
  "Vérification de votre progression…",
  "Préparation de vos recommandations…",
  "Synchronisation avec votre conseiller…",
];

function ProgressivePathLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="pp-loader-shell">
      <div className="pp-loader-card">
        <div className="pp-loader-spinner">
          <span />
          <span />
          <span />
        </div>
        <p className={`pp-loader-msg${visible ? " pp-loader-msg--in" : " pp-loader-msg--out"}`}>
          {LOADING_MESSAGES[msgIndex]}
        </p>
        <p className="pp-loader-sub">Cela prend généralement moins d&apos;une minute.</p>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function ProgressivePathView() {
  const [data, setData] = useState<ProgressivePath | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [result, guide] = await Promise.all([fetchProgressivePath(), fetchGuidance()]);
        if (active) {
          setData(result);
          setGuidance(guide);
        }
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
      if (result) {
        setData(result);
        // refresh guidance so phase + recommendations stay in sync
        const guide = await fetchGuidance();
        setGuidance(guide);
      } else {
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  const handleStart    = (id: string) => runAction(() => startStep(id));
  const handleComplete = (id: string) => runAction(() => completeStep(id));
  const handleReopen   = (id: string) => runAction(() => reopenStep(id));
  const handleDeposit  = (body: OfficialDepositBody) => runAction(() => declareOfficialDeposit(body));

  if (isLoading) {
    return <ProgressivePathLoader />;
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
      {/* Header compact */}
      <div className="pp-compact-header">
        <div className="pp-compact-left">
          <h1 className="pp-compact-title">Mon parcours guidé</h1>
        </div>
        <div className="pp-compact-progress">
          <span>{progress_percent}%</span>
          <div className="pp-progress-bar">
            <div className="pp-progress-fill" style={{ width: `${progress_percent}%` }} />
          </div>
        </div>
      </div>

      {/* Phase tunnel */}
      <PhaseTunnel steps={steps} guidancePhase={guidance?.phase} />

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      {/* Next step */}
      {current_step ? (
        <NextStepZone
          step={current_step}
          guidance={guidance}
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

      {/* Avertissement officiel */}
      {guidance?.official_warning ? (
        <OfficialWarningBlock text={guidance.official_warning} />
      ) : null}

      {/* Options */}
      <OptionsSection guidance={guidance} recommendations={recommendations} />

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
