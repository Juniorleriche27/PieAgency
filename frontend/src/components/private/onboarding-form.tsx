"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, ShieldCheck } from "lucide-react";
import { CopilotBanner } from "@/components/private/copilot-banner";
import {
  fetchOnboardingStatus,
  ONBOARDING_DRAFT_STORAGE_KEY,
  ONBOARDING_STEP_STORAGE_KEY,
  ONBOARDING_STEPS,
  REQUIRED_DOCUMENTS,
  submitOnboarding,
  type OnboardingData,
  type OnboardingStatus,
} from "@/lib/private-onboarding";

function getInitialOnboardingData(): OnboardingData {
  if (typeof window === "undefined") return {};
  const rawDraft = window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
  if (!rawDraft) return {};
  try {
    return JSON.parse(rawDraft) as OnboardingData;
  } catch {
    window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    return {};
  }
}

function getInitialOnboardingStep() {
  if (typeof window === "undefined") return 1;
  const rawStep = window.localStorage.getItem(ONBOARDING_STEP_STORAGE_KEY);
  const savedStep = Number(rawStep);
  return Number.isInteger(savedStep) && savedStep >= 1 && savedStep <= ONBOARDING_STEPS.length
    ? savedStep
    : 1;
}

type OnboardingStatusPanelProps = {
  description: string;
  eyebrow: string;
  icon: "check" | "clock" | "shield";
  note?: string;
  primaryAction?: { href: string; label: string };
  title: string;
};

function OnboardingStatusPanel({
  description,
  eyebrow,
  icon,
  note,
  primaryAction,
  title,
}: OnboardingStatusPanelProps) {
  const Icon = icon === "shield" ? ShieldCheck : icon === "check" ? CheckCircle2 : Clock3;

  return (
    <div className="ob-success ob-status-card">
      <div className={`ob-status-icon ob-status-icon--${icon}`}>
        <Icon size={34} aria-hidden />
      </div>
      <p className="ob-status-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {note ? <p className="ob-success-note">{note}</p> : null}
      <div className="ob-status-steps" aria-label="Etapes de validation">
        <span>Analyse des informations</span>
        <span>Verification des documents</span>
        <span>Validation ou retour a corriger</span>
      </div>
      <div className="ob-status-actions">
        {primaryAction ? (
          <Link className="btn btn-primary" href={primaryAction.href}>
            {primaryAction.label}
          </Link>
        ) : (
          <Link className="btn btn-outline" href="/espace-etudiant/documents">
            Voir mes documents
          </Link>
        )}
      </div>
    </div>
  );
}

export function OnboardingForm() {
  const [step, setStep] = useState(getInitialOnboardingStep);
  const [data, setData] = useState<OnboardingData>(getInitialOnboardingData);
  const [done, setDone] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<OnboardingStatus>(null);
  const [statusChecked, setStatusChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step - 1];
  const pct = Math.round((step / total) * 100);

  const set = (id: string, value: string) => setData((prev) => ({ ...prev, [id]: value }));
  const getSelectedValues = (id: string) => data[id]?.split("|||").filter(Boolean) ?? [];
  const toggleMulti = (id: string, value: string) => {
    setData((prev) => {
      const values = prev[id]?.split("|||").filter(Boolean) ?? [];
      const next = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...prev, [id]: next.join("|||") };
    });
  };

  useEffect(() => {
    let active = true;
    void fetchOnboardingStatus().then((status) => {
      if (!active) return;
      setRemoteStatus(status);
      setStatusChecked(true);
      if (status === "submitted" || status === "under_review" || status === "validated") {
        window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
        window.localStorage.removeItem(ONBOARDING_STEP_STORAGE_KEY);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!statusChecked || remoteStatus === "submitted" || remoteStatus === "under_review" || remoteStatus === "validated") {
      return;
    }
    window.localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(data));
  }, [data, remoteStatus, statusChecked]);

  useEffect(() => {
    if (!statusChecked || remoteStatus === "submitted" || remoteStatus === "under_review" || remoteStatus === "validated") {
      return;
    }
    window.localStorage.setItem(ONBOARDING_STEP_STORAGE_KEY, String(step));
  }, [remoteStatus, statusChecked, step]);

  const isDocStep = current.questions.length === 0;
  const isComplete =
    isDocStep ||
    current.questions.every((q) => {
      if (q.required && !data[q.id]?.trim()) return false;
      if (q.id === "country" && data.country === "Autre") {
        return Boolean(data.countryOther?.trim());
      }
      return true;
    });

  async function handleNext() {
    if (step < total) {
      setStep((s) => s + 1);
    } else {
      setErrorMessage("");
      try {
        const payload = {
          ...data,
          country: data.country === "Autre" ? data.countryOther?.trim() || "Autre" : data.country,
          mainNeed: getSelectedValues("mainNeed").join(", "),
        };
        await submitOnboarding(payload);
        window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
        window.localStorage.removeItem(ONBOARDING_STEP_STORAGE_KEY);
        setRemoteStatus("submitted");
        setDone(true);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer l'onboarding.",
        );
      }
    }
  }

  if (!statusChecked) {
    return (
      <OnboardingStatusPanel
        description="Nous verifions l'etat de votre dossier avant d'afficher la prochaine action."
        eyebrow="Embarquement"
        icon="clock"
        title="Verification du statut"
      />
    );
  }

  if (done || remoteStatus === "submitted" || remoteStatus === "under_review") {
    return (
      <OnboardingStatusPanel
        description="Votre embarquement a bien ete transmis. L'equipe PieAgency analyse vos informations et vos documents avant d'ouvrir votre espace de suivi."
        eyebrow="Validation en attente"
        icon="clock"
        note="Vous serez informe des que votre dossier sera valide ou si une correction est necessaire."
        title={remoteStatus === "under_review" ? "Analyse en cours" : "Dossier transmis"}
      />
    );
  }

  if (remoteStatus === "validated") {
    return (
      <OnboardingStatusPanel
        description="Votre dossier de depart a ete valide par l'equipe PieAgency. Vous pouvez continuer depuis votre tableau de bord."
        eyebrow="Acces valide"
        icon="shield"
        primaryAction={{ href: "/espace-etudiant", label: "Ouvrir le tableau de bord" }}
        title="Votre espace de suivi est ouvert"
      />
    );
  }

  if (done) {
    return (
      <div className="ob-success">
        <CheckCircle2 size={48} className="ob-success-icon" aria-hidden />
        <h2>Dossier soumis !</h2>
        <p>
          Vos informations et documents ont bien été transmis. L&apos;équipe PieAgency va analyser votre dossier.
        </p>
        <p className="ob-success-note">
          Vous recevrez une confirmation dès que votre espace de suivi sera ouvert.
        </p>
      </div>
    );
  }

  return (
    <div className="ob-wrap">
      <CopilotBanner />
      {/* Header */}
      <div className="ob-head">
        <h1>Embarquement</h1>
        <p>Répondez à quelques questions pour que nous vous proposions les bons outils et ressources.</p>
      </div>

      {/* Progress */}
      <div className="ob-progress-block">
        <div className="ob-progress-labels">
          <span>Étape {step} sur {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="ob-progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="ob-card">
        <div className="ob-card-header">
          <h2>{current.title}</h2>
          <p>{current.description}</p>
        </div>

        <div className="ob-card-body">
          {isDocStep ? (
            <div className="ob-doc-step">
              <ul className="ob-doc-list">
                {REQUIRED_DOCUMENTS.map((doc) => (
                  <li key={doc.label} className="ob-doc-item">
                    <FileText size={15} className="ob-doc-icon" />
                    <span>{doc.label}</span>
                    {!doc.required && <span className="ob-doc-optional">optionnel</span>}
                  </li>
                ))}
              </ul>
              <Link className="btn btn-primary ob-doc-btn" href="/espace-etudiant/documents">
                Ouvrir Mes documents →
              </Link>
              <p className="ob-doc-note">
                Ajoutez vos documents dans le module <strong>Mes documents</strong>, puis revenez ici pour soumettre votre dossier.
              </p>
            </div>
          ) : null}
          {current.questions.map((q) => (
            <div key={q.id} className="ob-field">
              <label className="ob-label" htmlFor={q.id}>
                {q.label}
                {q.required && <span className="ob-required" aria-hidden>*</span>}
              </label>

              {q.type === "text" && (
                <input
                  id={q.id}
                  className="ob-input"
                  type="text"
                  placeholder={`Entrez ${q.label.toLowerCase()}`}
                  value={data[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                />
              )}

              {q.type === "select" && (
                <>
                  <select
                    id={q.id}
                    className="ob-select"
                    value={data[q.id] ?? ""}
                    onChange={(e) => set(q.id, e.target.value)}
                  >
                    <option value="" disabled>Sélectionnez une option</option>
                    {q.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {q.id === "country" && data.country === "Autre" ? (
                    <input
                      id="countryOther"
                      className="ob-input"
                      type="text"
                      placeholder="Précisez votre pays de résidence"
                      value={data.countryOther ?? ""}
                      onChange={(e) => set("countryOther", e.target.value)}
                    />
                  ) : null}
                </>
              )}

              {q.type === "radio" && (
                <div className="ob-radio-group" role="radiogroup" aria-labelledby={`${q.id}-label`}>
                  <span id={`${q.id}-label`} className="sr-only">{q.label}</span>
                  {q.options?.map((opt) => (
                    <label key={opt} className={`ob-radio-item${data[q.id] === opt ? " selected" : ""}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={data[q.id] === opt}
                        onChange={() => set(q.id, opt)}
                        className="sr-only"
                      />
                      <span className="ob-radio-dot" aria-hidden />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.type === "checkbox" && (
                <div className="ob-radio-group" role="group" aria-labelledby={`${q.id}-label`}>
                  <span id={`${q.id}-label`} className="sr-only">{q.label}</span>
                  {q.options?.map((opt) => {
                    const selected = getSelectedValues(q.id).includes(opt);
                    return (
                      <label key={opt} className={`ob-radio-item${selected ? " selected" : ""}`}>
                        <input
                          type="checkbox"
                          name={q.id}
                          value={opt}
                          checked={selected}
                          onChange={() => toggleMulti(q.id, opt)}
                          className="sr-only"
                        />
                        <span className="ob-checkbox-dot" aria-hidden />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      {/* Navigation */}
      <div className="ob-nav">
        <button
          className="btn btn-outline ob-nav-btn"
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ArrowLeft size={16} aria-hidden />
          Précédent
        </button>

        <button
          className="btn btn-primary ob-nav-btn"
          type="button"
          onClick={handleNext}
          disabled={!isComplete}
        >
          {step === total ? (
            <>
              <CheckCircle2 size={16} aria-hidden />
              Terminer
            </>
          ) : (
            <>
              Suivant
              <ArrowRight size={16} aria-hidden />
            </>
          )}
        </button>
      </div>

      {/* Step dots */}
      <div className="ob-dots" aria-hidden>
        {ONBOARDING_STEPS.map((s) => (
          <span
            key={s.id}
            className={`ob-dot${s.id < step ? " past" : s.id === step ? " current" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
