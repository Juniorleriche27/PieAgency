"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { CopilotBanner } from "@/components/private/copilot-banner";
import { ONBOARDING_STEPS, submitOnboarding, type OnboardingData } from "@/lib/private-onboarding";

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step - 1];
  const pct = Math.round((step / total) * 100);

  const set = (id: string, value: string) => setData((prev) => ({ ...prev, [id]: value }));

  const isComplete = current.questions.every((q) => !q.required || data[q.id]?.trim());

  async function handleNext() {
    if (step < total) {
      setStep((s) => s + 1);
    } else {
      setErrorMessage("");
      try {
        await submitOnboarding(data);
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
        <h2>Embarquement terminé !</h2>
        <p>
          Vos informations ont bien été enregistrées. Nous allons maintenant personnaliser votre
          expérience.
        </p>
        <p className="ob-success-note">
          La synchronisation avec votre conseiller sera disponible prochainement.
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
