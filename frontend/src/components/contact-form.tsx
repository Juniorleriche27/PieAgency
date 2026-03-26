"use client";

import { useMemo, useRef, useState } from "react";
import { company } from "@/content/site";
import { getApiBaseUrl } from "@/lib/auth";

type ChoiceValue = "" | "yes" | "no";

type StudyLevelValue =
  | "Baccalaureat"
  | "Licence / Bachelor"
  | "Master"
  | "Doctorat"
  | "Autre";

type TargetProjectValue = "Campus France" | "Campus Belgique";

type ContactFormState = {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  lastDegree: StudyLevelValue | "";
  fundingSource: string;
  targetProject: TargetProjectValue | "";
  guarantorInformed: ChoiceValue;
  consultationDate: string;
  consultationTime: string;
  consentResources: boolean;
};

type FormErrors = Partial<Record<keyof ContactFormState, string>>;

type StepDefinition = {
  title: string;
  description: string;
  fields: Array<keyof ContactFormState>;
};

type ChoiceOption<Value extends string> = {
  value: Value;
  label: string;
};

const degreeOptions: ChoiceOption<StudyLevelValue>[] = [
  { value: "Baccalaureat", label: "Baccalaureat" },
  { value: "Licence / Bachelor", label: "Licence / Bachelor" },
  { value: "Master", label: "Master" },
  { value: "Doctorat", label: "Doctorat" },
  { value: "Autre", label: "Autre" },
];

const projectOptions: ChoiceOption<TargetProjectValue>[] = [
  { value: "Campus France", label: "Campus France" },
  { value: "Campus Belgique", label: "Campus Belgique" },
];

const binaryOptions: ChoiceOption<Exclude<ChoiceValue, "">>[] = [
  { value: "yes", label: "Oui" },
  { value: "no", label: "Non" },
];

const steps: StepDefinition[] = [
  {
    title: "Vos coordonnees",
    description: "Comment pouvons-nous vous contacter rapidement ?",
    fields: ["fullName", "phone", "email", "country"],
  },
  {
    title: "Dernier diplome",
    description: "Quel est votre dernier diplome obtenu ?",
    fields: ["lastDegree"],
  },
  {
    title: "Financement",
    description: "Qui financera vos etudes et votre projet ?",
    fields: ["fundingSource"],
  },
  {
    title: "Projet vise",
    description: "Souhaitez-vous avancer sur Campus France ou la Belgique ?",
    fields: ["targetProject"],
  },
  {
    title: "Garant financier",
    description: "Le garant financier est-il deja informe de votre projet d'immigration ?",
    fields: ["guarantorInformed"],
  },
  {
    title: "Consultation",
    description: "Choisissez votre disponibilite pour une consultation gratuite a distance.",
    fields: ["consultationDate", "consultationTime", "consentResources"],
  },
];

const initialState: ContactFormState = {
  fullName: "",
  phone: "",
  email: "",
  country: "",
  lastDegree: "",
  fundingSource: "",
  targetProject: "",
  guarantorInformed: "",
  consultationDate: "",
  consultationTime: "",
  consentResources: false,
};

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

function derivePhoneCountryCode(phone: string) {
  const match = phone.trim().match(/^(\+\d{1,4})/);
  return match?.[1] ?? "+228";
}

function buildStructuredMessage(form: ContactFormState) {
  return [
    "Formulaire simplifie PieAgency",
    "",
    "Coordonnees",
    `- Nom complet: ${form.fullName.trim()}`,
    `- Telephone: ${form.phone.trim()}`,
    `- Email: ${form.email.trim()}`,
    `- Pays: ${form.country.trim()}`,
    "",
    "Projet",
    `- Dernier diplome: ${form.lastDegree}`,
    `- Financement des etudes: ${form.fundingSource.trim()}`,
    `- Projet vise: ${form.targetProject}`,
    `- Garant financier deja informe: ${form.guarantorInformed === "yes" ? "Oui" : "Non"}`,
    `- Disponibilite consultation: ${form.consultationDate} a ${form.consultationTime}`,
  ].join("\n");
}

type CompactChoiceGroupProps<Value extends string> = {
  error?: string;
  options: ChoiceOption<Value>[];
  value: Value | "";
  onSelect: (value: Value) => void;
};

function CompactChoiceGroup<Value extends string>({
  error,
  options,
  value,
  onSelect,
}: CompactChoiceGroupProps<Value>) {
  return (
    <>
      <div className="form-compact-choice-grid">
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={`form-compact-choice ${value === option.value ? "is-selected" : ""}`}
            key={option.value}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      {error ? <div className="form-error">{error}</div> : null}
    </>
  );
}

export function ContactForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const activeStep = steps[currentStep];

  function validate(current: ContactFormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (current.fullName.trim().length < 3) {
      nextErrors.fullName = "Entrez votre nom et prenom.";
    }
    if (current.phone.trim().length < 6) {
      nextErrors.phone = "Le telephone est requis.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())) {
      nextErrors.email = "L'email n'est pas valide.";
    }
    if (current.country.trim().length < 2) {
      nextErrors.country = "Indiquez votre pays.";
    }
    if (!current.lastDegree) {
      nextErrors.lastDegree = "Selectionnez votre dernier diplome.";
    }
    if (current.fundingSource.trim().length < 2) {
      nextErrors.fundingSource = "Indiquez qui financera les etudes.";
    }
    if (!current.targetProject) {
      nextErrors.targetProject = "Choisissez Campus France ou Campus Belgique.";
    }
    if (!binaryOptions.some((option) => option.value === current.guarantorInformed)) {
      nextErrors.guarantorInformed = "Precisez si le garant est deja informe.";
    }
    if (!current.consultationDate) {
      nextErrors.consultationDate = "Choisissez un jour de consultation.";
    }
    if (!current.consultationTime) {
      nextErrors.consultationTime = "Choisissez une heure de consultation.";
    }
    if (!current.consentResources) {
      nextErrors.consentResources = "Autorisez PieAgency a vous recontacter.";
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
      const { firstName, lastName } = splitFullName(form.fullName);
      const summaryMessage = buildStructuredMessage(form);
      const isBelgiumProject = form.targetProject === "Campus Belgique";

      const response = await fetch(`${apiBaseUrl}/api/contact-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: form.email.trim(),
          phone_country_code: derivePhoneCountryCode(form.phone),
          phone: form.phone.trim(),
          country: form.country.trim(),
          has_baccalaureate: false,
          baccalaureate_year: null,
          high_school_year_count: null,
          repeated_high_school_class: null,
          baccalaureate_average: null,
          baccalaureate_track: null,
          has_licence: false,
          licence_year: null,
          repeated_licence_class: null,
          licence_year_count: null,
          licence_average: null,
          licence_field: null,
          has_master: false,
          study_level: form.lastDegree,
          target_project: form.targetProject,
          immigration_attempt_count: 0,
          school_type: "Je reflechis pour le moment",
          current_activity: `Dernier diplome declare: ${form.lastDegree}.`,
          france_motivation: isBelgiumProject
            ? "Le prospect souhaite un accompagnement Belgique et precisera sa motivation pendant la consultation."
            : "Le prospect souhaite un accompagnement Campus France et precisera sa motivation pendant la consultation.",
          funding_source: form.fundingSource.trim(),
          assistance_preference: isBelgiumProject
            ? "Accompagnement Belgique"
            : "Accompagnement Campus France",
          consultation_date: form.consultationDate,
          consultation_time: form.consultationTime,
          referrer_name: "Formulaire web",
          can_invest: form.guarantorInformed === "yes",
          consent_resources: form.consentResources,
          message: summaryMessage,
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
          "Votre demande a bien ete envoyee. Un conseiller PieAgency vous recontactera rapidement.",
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
    <form className="form-card form-compact-funnel" onSubmit={handleSubmit} ref={formRef}>
      <div className="form-step-dots" aria-label="Etapes du formulaire">
        {steps.map((step, index) => (
          <button
            aria-current={index === currentStep ? "step" : undefined}
            className={`form-step-dot ${index === currentStep ? "is-active" : ""} ${
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
            {index + 1}
          </button>
        ))}
      </div>

      {feedback ? (
        <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div>
      ) : null}

      <div className="form-compact-step">
        <div className="form-compact-step-head">
          <div className="form-compact-step-icon">{currentStep + 1}</div>
          <div className="form-compact-step-copy">
            <h3>{activeStep.title}</h3>
            <p>{activeStep.description}</p>
          </div>
        </div>

        {currentStep === 0 ? (
          <div className="form-compact-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                Nom & Prenom
              </label>
              <input
                aria-invalid={Boolean(errors.fullName)}
                className="form-input"
                id="fullName"
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Nom & Prenom"
                type="text"
                value={form.fullName}
              />
              {errors.fullName ? <div className="form-error">{errors.fullName}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Telephone
              </label>
              <input
                aria-invalid={Boolean(errors.phone)}
                className="form-input"
                id="phone"
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+228 92 00 00 00"
                type="tel"
                value={form.phone}
              />
              {errors.phone ? <div className="form-error">{errors.phone}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
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
        ) : null}

        {currentStep === 1 ? (
          <div className="form-group">
            <label className="form-label">Quel est votre dernier diplome ?</label>
            <CompactChoiceGroup
              error={errors.lastDegree}
              onSelect={(value) => updateField("lastDegree", value)}
              options={degreeOptions}
              value={form.lastDegree}
            />
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="form-group">
            <label className="form-label" htmlFor="fundingSource">
              Qui financera vos etudes ?
            </label>
            <input
              aria-invalid={Boolean(errors.fundingSource)}
              className="form-input"
              id="fundingSource"
              onChange={(event) => updateField("fundingSource", event.target.value)}
              placeholder="Parents, garant, moi-meme..."
              type="text"
              value={form.fundingSource}
            />
            {errors.fundingSource ? (
              <div className="form-error">{errors.fundingSource}</div>
            ) : null}
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="form-group">
            <label className="form-label">
              Etes-vous interesse par Campus France ou Belgique ?
            </label>
            <CompactChoiceGroup
              error={errors.targetProject}
              onSelect={(value) => updateField("targetProject", value)}
              options={projectOptions}
              value={form.targetProject}
            />
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div className="form-group">
            <label className="form-label">
              Le garant financier est-il deja informe de votre projet ?
            </label>
            <CompactChoiceGroup
              error={errors.guarantorInformed}
              onSelect={(value) => updateField("guarantorInformed", value)}
              options={binaryOptions}
              value={form.guarantorInformed}
            />
          </div>
        ) : null}

        {currentStep === 5 ? (
          <div className="form-compact-fields">
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

            <label className="form-check form-compact-check">
              <input
                checked={form.consentResources}
                onChange={(event) => updateField("consentResources", event.target.checked)}
                type="checkbox"
              />
              <span>
                J&apos;accepte d&apos;etre recontacte(e) par PieAgency pour cette
                consultation gratuite a distance.
              </span>
            </label>
            {errors.consentResources ? (
              <div className="form-error">{errors.consentResources}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="form-compact-footer">
        <div className="form-compact-note">
          Besoin d&apos;aide tout de suite ? Ecrivez-nous sur{" "}
          <a href={company.contacts.togo.whatsappHref} rel="noreferrer" target="_blank">
            WhatsApp
          </a>
          .
        </div>
        <div className="form-compact-actions">
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
              className="btn btn-green"
              disabled={isSubmitting}
              onClick={handleNextStep}
              type="button"
            >
              Continuer
            </button>
          ) : (
            <button className="btn btn-green" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
