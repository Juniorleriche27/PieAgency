"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { CopilotBanner } from "@/components/private/copilot-banner";
import { ONBOARDING_STEPS, REQUIRED_DOCUMENTS, submitOnboarding, type OnboardingData } from "@/lib/private-onboarding";

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step - 1];
  const pct = Math.round((step / total) * 100);

  const set = (id: string, value: string) => setData((prev) => ({ ...prev, [id]: value }));

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
        };
        await submitOnboarding(payload);
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
