"use client";

import { useMemo, useRef, useState } from "react";
import { company } from "@/content/site";
import { getApiBaseUrl } from "@/lib/auth";

type ContactFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  country: string;
  studyLevel: string;
  targetProject: string;
  immigrationAttemptCount: string;
  schoolType: string;
  fundingSource: string;
  assistancePreference: string;
  consultationDate: string;
  consultationTime: string;
  referrerName: string;
  canInvest: string;
  message: string;
  consentResources: boolean;
};

type FormErrors = Partial<Record<keyof ContactFormState, string>>;

type StepDefinition = {
  title: string;
  description: string;
  fields: Array<keyof ContactFormState>;
};

const studyLevels = [
  "Baccalaureat",
  "Licence / Bachelor",
  "Master",
  "Doctorat",
  "Autre",
];

const projectOptions = [
  "Campus France",
  "Procedure Visa",
  "Campus Belgique",
  "Paris-Saclay",
  "Parcoursup",
  "Ecoles privees France",
  "Autre",
];

const schoolTypeOptions = [
  "Ecole de commerce",
  "Ecole d'ingenieur",
  "Universite privee",
  "Universite publique",
  "Je reflechis pour le moment",
];

const assistanceOptions = [
  "Diagnostic complet du projet",
  "Accompagnement Campus France",
  "Accompagnement procedure visa",
  "Accompagnement Belgique",
  "Accompagnement Parcoursup",
  "Accompagnement ecoles privees",
  "Coaching et relecture de dossier",
];

const steps: StepDefinition[] = [
  {
    title: "Profil",
    description: "Vos coordonnees de base pour qu'un conseiller puisse vous recontacter rapidement.",
    fields: ["firstName", "lastName", "email", "phoneCountryCode", "phone", "country"],
  },
  {
    title: "Projet",
    description: "Le type de parcours que vous visez et votre niveau d'avancement actuel.",
    fields: ["studyLevel", "targetProject", "immigrationAttemptCount", "schoolType"],
  },
  {
    title: "Offre",
    description: "Le service dont vous avez besoin et la capacite a investir dans l'accompagnement.",
    fields: ["fundingSource", "assistancePreference", "canInvest"],
  },
  {
    title: "Consultation",
    description: "Le meilleur moment pour l'echange et la personne qui vous a oriente vers nous.",
    fields: ["consultationDate", "consultationTime", "referrerName"],
  },
  {
    title: "Validation",
    description: "Votre contexte, votre objectif et le consentement final avant l'envoi.",
    fields: ["message", "consentResources"],
  },
];

const initialState: ContactFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phoneCountryCode: "+228",
  phone: "",
  country: "",
  studyLevel: "",
  targetProject: "",
  immigrationAttemptCount: "0",
  schoolType: "",
  fundingSource: "",
  assistancePreference: "",
  consultationDate: "",
  consultationTime: "",
  referrerName: "",
  canInvest: "",
  message: "",
  consentResources: false,
};

export function ContactForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const activeStep = steps[currentStep];
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  function validate(current: ContactFormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (current.firstName.trim().length < 2) {
      nextErrors.firstName = "Le prenom est requis.";
    }
    if (current.lastName.trim().length < 2) {
      nextErrors.lastName = "Le nom de famille est requis.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())) {
      nextErrors.email = "L'email n'est pas valide.";
    }
    if (!current.phoneCountryCode.trim().startsWith("+")) {
      nextErrors.phoneCountryCode = "L'indicatif doit commencer par +.";
    }
    if (current.phone.trim().length < 6) {
      nextErrors.phone = "Le numero WhatsApp ou telephone est requis.";
    }
    if (current.country.trim().length < 2) {
      nextErrors.country = "Le pays est requis.";
    }
    if (!current.studyLevel) {
      nextErrors.studyLevel = "Selectionnez votre niveau d'etudes.";
    }
    if (!current.targetProject) {
      nextErrors.targetProject = "Selectionnez le projet vise.";
    }
    if (!/^\d+$/.test(current.immigrationAttemptCount)) {
      nextErrors.immigrationAttemptCount = "Entrez un nombre valide.";
    }
    if (!current.schoolType) {
      nextErrors.schoolType = "Selectionnez le type d'ecole vise.";
    }
    if (current.fundingSource.trim().length < 2) {
      nextErrors.fundingSource = "Indiquez qui financera les etudes.";
    }
    if (!current.assistancePreference) {
      nextErrors.assistancePreference = "Choisissez le service souhaite.";
    }
    if (!current.consultationDate) {
      nextErrors.consultationDate = "Choisissez une date de consultation.";
    }
    if (!current.consultationTime) {
      nextErrors.consultationTime = "Choisissez une heure de consultation.";
    }
    if (current.referrerName.trim().length < 2) {
      nextErrors.referrerName = "Indiquez qui vous a envoye le formulaire.";
    }
    if (current.canInvest !== "yes" && current.canInvest !== "no") {
      nextErrors.canInvest = "Selectionnez Oui ou Non.";
    }
    if (current.message.trim().length < 20) {
      nextErrors.message = "Decrivez un peu plus votre situation.";
    }
    if (!current.consentResources) {
      nextErrors.consentResources = "Le consentement est requis.";
    }

    return nextErrors;
  }

  function validateStep(stepIndex: number, current: ContactFormState) {
    const fullErrors = validate(current);
    const stepErrors: FormErrors = {};

    for (const field of steps[stepIndex].fields) {
      if (fullErrors[field]) {
        stepErrors[field] = fullErrors[field];
      }
    }

    return stepErrors;
  }

  function updateField<K extends keyof ContactFormState>(
    field: K,
    value: ContactFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFeedback(null);
  }

  function moveToStep(stepIndex: number) {
    setCurrentStep(stepIndex);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleNextStep() {
    const stepErrors = validateStep(currentStep, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((previous) => ({ ...previous, ...stepErrors }));
      return;
    }

    moveToStep(Math.min(currentStep + 1, steps.length - 1));
  }

  function handlePreviousStep() {
    moveToStep(Math.max(currentStep - 1, 0));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidStep = steps.findIndex((step) =>
        step.fields.some((field) => nextErrors[field]),
      );
      if (firstInvalidStep >= 0) {
        moveToStep(firstInvalidStep);
      }
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone_country_code: form.phoneCountryCode.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          study_level: form.studyLevel,
          target_project: form.targetProject,
          immigration_attempt_count: Number(form.immigrationAttemptCount),
          school_type: form.schoolType,
          funding_source: form.fundingSource.trim(),
          assistance_preference: form.assistancePreference,
          consultation_date: form.consultationDate,
          consultation_time: form.consultationTime,
          referrer_name: form.referrerName.trim(),
          can_invest: form.canInvest === "yes",
          consent_resources: form.consentResources,
          message: form.message.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { detail?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.detail ??
            payload?.message ??
            "Impossible d'envoyer la demande pour le moment.",
        );
      }

      setFeedback({
        type: "success",
        message:
          "Votre demande a bien ete envoyee. Notre equipe vous recontactera rapidement.",
      });
      setForm(initialState);
      setErrors({});
      moveToStep(0);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant l'envoi du formulaire.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-card form-funnel-card" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-funnel-head">
        <div className="form-step-eyebrow">Tunnel de vente PieAgency</div>
        <h3>Commencer votre diagnostic</h3>
        <p>
          Repondez en 5 phases courtes. On qualifie votre besoin, puis on vous
          oriente vers le bon accompagnement et le bon conseiller.
        </p>

        <div aria-hidden="true" className="form-step-meter">
          <div className="form-step-meter-bar" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="form-step-progress">
          {steps.map((step, index) => (
            <button
              className={`form-step-chip ${index === currentStep ? "is-active" : ""} ${
                index < currentStep ? "is-done" : ""
              }`}
              key={step.title}
              onClick={() => {
                if (index <= currentStep) {
                  moveToStep(index);
                }
              }}
              type="button"
            >
              <span className="form-step-index">{index + 1}</span>
              <span className="form-step-label">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {feedback ? (
        <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div>
      ) : null}

      <div className="form-step-body">
        <div className="form-step-copy">
          <div className="form-step-counter">
            Etape {currentStep + 1} / {steps.length}
          </div>
          <h4>{activeStep.title}</h4>
          <p>{activeStep.description}</p>
        </div>

        {currentStep === 0 ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">
                  Prenom
                </label>
                <input
                  aria-invalid={Boolean(errors.firstName)}
                  className="form-input"
                  id="firstName"
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="Votre prenom"
                  type="text"
                  value={form.firstName}
                />
                {errors.firstName ? <div className="form-error">{errors.firstName}</div> : null}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">
                  Nom de famille
                </label>
                <input
                  aria-invalid={Boolean(errors.lastName)}
                  className="form-input"
                  id="lastName"
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder="Votre nom"
                  type="text"
                  value={form.lastName}
                />
                {errors.lastName ? <div className="form-error">{errors.lastName}</div> : null}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Adresse email
                </label>
                <input
                  aria-invalid={Boolean(errors.email)}
                  className="form-input"
                  id="email"
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="vous@email.com"
                  type="email"
                  value={form.email}
                />
                {errors.email ? <div className="form-error">{errors.email}</div> : null}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="country">
                  Pays
                </label>
                <input
                  aria-invalid={Boolean(errors.country)}
                  className="form-input"
                  id="country"
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Togo, Benin, Senegal..."
                  type="text"
                  value={form.country}
                />
                {errors.country ? <div className="form-error">{errors.country}</div> : null}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phoneCountryCode">
                  Indicatif regional
                </label>
                <input
                  aria-invalid={Boolean(errors.phoneCountryCode)}
                  className="form-input"
                  id="phoneCountryCode"
                  onChange={(event) => updateField("phoneCountryCode", event.target.value)}
                  placeholder="+228"
                  type="text"
                  value={form.phoneCountryCode}
                />
                {errors.phoneCountryCode ? (
                  <div className="form-error">{errors.phoneCountryCode}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Numero WhatsApp / Telephone
                </label>
                <input
                  aria-invalid={Boolean(errors.phone)}
                  className="form-input"
                  id="phone"
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="92 09 25 72"
                  type="tel"
                  value={form.phone}
                />
                {errors.phone ? <div className="form-error">{errors.phone}</div> : null}
              </div>
            </div>
          </>
        ) : null}

        {currentStep === 1 ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="studyLevel">
                  Niveau d&apos;etudes
                </label>
                <select
                  aria-invalid={Boolean(errors.studyLevel)}
                  className="form-input"
                  id="studyLevel"
                  onChange={(event) => updateField("studyLevel", event.target.value)}
                  value={form.studyLevel}
                >
                  <option value="">Selectionner...</option>
                  {studyLevels.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.studyLevel ? <div className="form-error">{errors.studyLevel}</div> : null}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="targetProject">
                  Projet vise
                </label>
                <select
                  aria-invalid={Boolean(errors.targetProject)}
                  className="form-input"
                  id="targetProject"
                  onChange={(event) => updateField("targetProject", event.target.value)}
                  value={form.targetProject}
                >
                  <option value="">Selectionner...</option>
                  {projectOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.targetProject ? (
                  <div className="form-error">{errors.targetProject}</div>
                ) : null}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="immigrationAttemptCount">
                  Nombre d&apos;echecs a la procedure
                </label>
                <input
                  aria-invalid={Boolean(errors.immigrationAttemptCount)}
                  className="form-input"
                  id="immigrationAttemptCount"
                  min="0"
                  onChange={(event) =>
                    updateField("immigrationAttemptCount", event.target.value)
                  }
                  type="number"
                  value={form.immigrationAttemptCount}
                />
                {errors.immigrationAttemptCount ? (
                  <div className="form-error">{errors.immigrationAttemptCount}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="schoolType">
                  Type d&apos;ecole vise
                </label>
                <select
                  aria-invalid={Boolean(errors.schoolType)}
                  className="form-input"
                  id="schoolType"
                  onChange={(event) => updateField("schoolType", event.target.value)}
                  value={form.schoolType}
                >
                  <option value="">Selectionner...</option>
                  {schoolTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.schoolType ? <div className="form-error">{errors.schoolType}</div> : null}
              </div>
            </div>
          </>
        ) : null}

        {currentStep === 2 ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="fundingSource">
                Qui financera vos etudes ?
              </label>
              <input
                aria-invalid={Boolean(errors.fundingSource)}
                className="form-input"
                id="fundingSource"
                onChange={(event) => updateField("fundingSource", event.target.value)}
                placeholder="Moi-meme, mes parents, un garant..."
                type="text"
                value={form.fundingSource}
              />
              {errors.fundingSource ? <div className="form-error">{errors.fundingSource}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="assistancePreference">
                Assistance souhaitee
              </label>
              <select
                aria-invalid={Boolean(errors.assistancePreference)}
                className="form-input"
                id="assistancePreference"
                onChange={(event) => updateField("assistancePreference", event.target.value)}
                value={form.assistancePreference}
              >
                <option value="">Selectionner...</option>
                {assistanceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.assistancePreference ? (
                <div className="form-error">{errors.assistancePreference}</div>
              ) : null}
            </div>

            <div className="form-group">
              <span className="form-label">
                Avez-vous les moyens d&apos;investir dans l&apos;accompagnement et les frais ?
              </span>
              <div className="form-radio-grid">
                {[
                  { value: "yes", label: "Oui, je peux investir" },
                  { value: "no", label: "Non, pas pour le moment" },
                ].map((option) => (
                  <button
                    className={`form-radio-card ${form.canInvest === option.value ? "is-selected" : ""}`}
                    key={option.value}
                    onClick={() => updateField("canInvest", option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.canInvest ? <div className="form-error">{errors.canInvest}</div> : null}
            </div>
          </>
        ) : null}

        {currentStep === 3 ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="consultationDate">
                  Jour disponible
                </label>
                <input
                  aria-invalid={Boolean(errors.consultationDate)}
                  className="form-input"
                  id="consultationDate"
                  onChange={(event) => updateField("consultationDate", event.target.value)}
                  type="date"
                  value={form.consultationDate}
                />
                {errors.consultationDate ? (
                  <div className="form-error">{errors.consultationDate}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="consultationTime">
                  Heure disponible
                </label>
                <input
                  aria-invalid={Boolean(errors.consultationTime)}
                  className="form-input"
                  id="consultationTime"
                  onChange={(event) => updateField("consultationTime", event.target.value)}
                  type="time"
                  value={form.consultationTime}
                />
                {errors.consultationTime ? (
                  <div className="form-error">{errors.consultationTime}</div>
                ) : null}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="referrerName">
                Qui vous a envoye le lien du formulaire ?
              </label>
              <input
                aria-invalid={Boolean(errors.referrerName)}
                className="form-input"
                id="referrerName"
                onChange={(event) => updateField("referrerName", event.target.value)}
                placeholder="Prenom, nom ou numero de la personne"
                type="text"
                value={form.referrerName}
              />
              {errors.referrerName ? <div className="form-error">{errors.referrerName}</div> : null}
            </div>
          </>
        ) : null}

        {currentStep === 4 ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="message">
                Votre situation
              </label>
              <textarea
                aria-invalid={Boolean(errors.message)}
                className="form-input"
                id="message"
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Expliquez votre projet, vos blocages, l'ecole ou le pays vise, et ce que vous attendez de PieAgency."
                value={form.message}
              />
              {errors.message ? <div className="form-error">{errors.message}</div> : null}
            </div>

            <div className="form-summary">
              <div className="form-summary-item">
                <span>Projet</span>
                <strong>{form.targetProject || "Non renseigne"}</strong>
              </div>
              <div className="form-summary-item">
                <span>Service</span>
                <strong>{form.assistancePreference || "Non renseigne"}</strong>
              </div>
              <div className="form-summary-item">
                <span>Consultation</span>
                <strong>
                  {form.consultationDate && form.consultationTime
                    ? `${form.consultationDate} a ${form.consultationTime}`
                    : "Non renseignee"}
                </strong>
              </div>
            </div>

            <label className="form-check">
              <input
                checked={form.consentResources}
                onChange={(event) => updateField("consentResources", event.target.checked)}
                type="checkbox"
              />
              <span>
                J&apos;accepte d&apos;etre recontacte(e) et de recevoir les ressources utiles de
                PieAgency pour avancer sur mon projet.
              </span>
            </label>
            {errors.consentResources ? (
              <div className="form-error">{errors.consentResources}</div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="form-step-footer">
        <div className="form-step-footer-note">
          Besoin d&apos;aide maintenant ? Ecrivez-nous sur{" "}
          <a href={company.contacts.togo.whatsappHref} rel="noreferrer" target="_blank">
            WhatsApp
          </a>
          .
        </div>
        <div className="form-step-footer-actions">
          <button
            className="btn btn-outline"
            disabled={currentStep === 0 || isSubmitting}
            onClick={handlePreviousStep}
            type="button"
          >
            Retour
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={handleNextStep}
              type="button"
            >
              Continuer
            </button>
          ) : (
            <button className="btn btn-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
