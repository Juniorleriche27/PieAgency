"use client";

import { useMemo, useRef, useState } from "react";
import { company } from "@/content/site";
import { getApiBaseUrl } from "@/lib/auth";

type ChoiceValue = "" | "yes" | "no";

type ContactFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  country: string;
  hasBaccalaureate: ChoiceValue;
  baccalaureateYear: string;
  highSchoolYearCount: string;
  repeatedHighSchoolClass: ChoiceValue;
  baccalaureateAverage: string;
  baccalaureateTrack: string;
  hasLicence: ChoiceValue;
  licenceYear: string;
  repeatedLicenceClass: ChoiceValue;
  licenceYearCount: string;
  licenceAverage: string;
  licenceField: string;
  hasMaster: ChoiceValue;
  studyLevel: string;
  targetProject: string;
  immigrationAttemptCount: string;
  schoolType: string;
  currentActivity: string;
  whyFrance: string;
  fundingSource: string;
  assistancePreference: string;
  consultationDate: string;
  consultationTime: string;
  referrerName: string;
  canInvest: ChoiceValue;
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

const currentYear = new Date().getFullYear();

const binaryOptions: Array<{ value: Exclude<ChoiceValue, "">; label: string }> = [
  { value: "yes", label: "Oui" },
  { value: "no", label: "Non" },
];

const steps: StepDefinition[] = [
  {
    title: "Profil",
    description: "Vos coordonnees directes pour que l'equipe puisse vous joindre rapidement.",
    fields: ["firstName", "lastName", "email", "phoneCountryCode", "phone", "country"],
  },
  {
    title: "Bac",
    description: "Votre parcours au lycee et les informations cles autour du baccalaureat.",
    fields: [
      "hasBaccalaureate",
      "baccalaureateYear",
      "highSchoolYearCount",
      "repeatedHighSchoolClass",
      "baccalaureateAverage",
      "baccalaureateTrack",
    ],
  },
  {
    title: "Licence",
    description: "Votre niveau d'etudes superieures, les repetitions et le parcours licence.",
    fields: [
      "hasLicence",
      "licenceYear",
      "repeatedLicenceClass",
      "licenceYearCount",
      "licenceAverage",
      "licenceField",
      "hasMaster",
    ],
  },
  {
    title: "Projet",
    description: "Votre objectif, votre situation actuelle et la raison concrete de votre projet France.",
    fields: [
      "studyLevel",
      "targetProject",
      "immigrationAttemptCount",
      "schoolType",
      "currentActivity",
      "whyFrance",
    ],
  },
  {
    title: "Offre",
    description: "Le service voulu, le financement et la capacite d'investissement dans le dossier.",
    fields: ["fundingSource", "assistancePreference", "canInvest"],
  },
  {
    title: "Consultation",
    description: "Le meilleur moment pour parler avec nous et la personne qui vous a envoye ici.",
    fields: ["consultationDate", "consultationTime", "referrerName"],
  },
  {
    title: "Validation",
    description: "Vos blocages complementaires et la validation finale avant l'envoi.",
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
  hasBaccalaureate: "",
  baccalaureateYear: "",
  highSchoolYearCount: "",
  repeatedHighSchoolClass: "",
  baccalaureateAverage: "",
  baccalaureateTrack: "",
  hasLicence: "",
  licenceYear: "",
  repeatedLicenceClass: "",
  licenceYearCount: "",
  licenceAverage: "",
  licenceField: "",
  hasMaster: "",
  studyLevel: "",
  targetProject: "",
  immigrationAttemptCount: "0",
  schoolType: "",
  currentActivity: "",
  whyFrance: "",
  fundingSource: "",
  assistancePreference: "",
  consultationDate: "",
  consultationTime: "",
  referrerName: "",
  canInvest: "",
  message: "",
  consentResources: false,
};

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

type BinaryChoiceProps = {
  field: keyof ContactFormState;
  label: string;
  value: ChoiceValue;
  error?: string;
  onChange: (field: keyof ContactFormState, value: ChoiceValue) => void;
  yesLabel?: string;
  noLabel?: string;
};

function BinaryChoice({
  field,
  label,
  value,
  error,
  onChange,
  yesLabel = "Oui",
  noLabel = "Non",
}: BinaryChoiceProps) {
  return (
    <div className="form-group">
      <span className="form-label">{label}</span>
      <div className="form-radio-grid">
        {[
          { value: "yes" as const, label: yesLabel },
          { value: "no" as const, label: noLabel },
        ].map((option) => (
          <button
            className={`form-radio-card ${value === option.value ? "is-selected" : ""}`}
            key={`${field}-${option.value}`}
            onClick={() => onChange(field, option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? <div className="form-error">{error}</div> : null}
    </div>
  );
}

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

    if (!binaryOptions.some((option) => option.value === current.hasBaccalaureate)) {
      nextErrors.hasBaccalaureate = "Indiquez si vous avez le bac.";
    }
    if (current.hasBaccalaureate === "yes") {
      const bacYear = parseOptionalNumber(current.baccalaureateYear);
      const highSchoolYears = parseOptionalNumber(current.highSchoolYearCount);

      if (
        typeof bacYear !== "number" ||
        !Number.isInteger(bacYear) ||
        bacYear < 1950 ||
        bacYear > currentYear + 1
      ) {
        nextErrors.baccalaureateYear = "Entrez une annee de bac valide.";
      }
      if (
        typeof highSchoolYears !== "number" ||
        !Number.isInteger(highSchoolYears) ||
        highSchoolYears < 1 ||
        highSchoolYears > 10
      ) {
        nextErrors.highSchoolYearCount = "Indiquez le nombre d'annees passees au lycee.";
      }
      if (!binaryOptions.some((option) => option.value === current.repeatedHighSchoolClass)) {
        nextErrors.repeatedHighSchoolClass = "Indiquez si vous avez redouble au lycee.";
      }
      if (current.baccalaureateAverage.trim().length < 2) {
        nextErrors.baccalaureateAverage = "Indiquez votre moyenne au bac.";
      }
      if (current.baccalaureateTrack.trim().length < 2) {
        nextErrors.baccalaureateTrack = "Indiquez la filiere du bac.";
      }
    }

    if (!binaryOptions.some((option) => option.value === current.hasLicence)) {
      nextErrors.hasLicence = "Indiquez si vous avez une licence.";
    }
    if (current.hasLicence === "yes") {
      const licenceYear = parseOptionalNumber(current.licenceYear);
      const licenceYears = parseOptionalNumber(current.licenceYearCount);

      if (
        typeof licenceYear !== "number" ||
        !Number.isInteger(licenceYear) ||
        licenceYear < 1950 ||
        licenceYear > currentYear + 1
      ) {
        nextErrors.licenceYear = "Entrez une annee de licence valide.";
      }
      if (
        typeof licenceYears !== "number" ||
        !Number.isInteger(licenceYears) ||
        licenceYears < 1 ||
        licenceYears > 12
      ) {
        nextErrors.licenceYearCount = "Indiquez le nombre d'annees dans le parcours licence.";
      }
      if (!binaryOptions.some((option) => option.value === current.repeatedLicenceClass)) {
        nextErrors.repeatedLicenceClass = "Indiquez si vous avez repris une classe de licence.";
      }
      if (current.licenceAverage.trim().length < 2) {
        nextErrors.licenceAverage = "Indiquez votre moyenne de licence.";
      }
      if (current.licenceField.trim().length < 2) {
        nextErrors.licenceField = "Indiquez la filiere ou le parcours de licence.";
      }
    }

    if (!binaryOptions.some((option) => option.value === current.hasMaster)) {
      nextErrors.hasMaster = "Indiquez si vous avez un master.";
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
    if (current.currentActivity.trim().length < 4) {
      nextErrors.currentActivity = "Expliquez ce que vous faites actuellement.";
    }
    if (current.whyFrance.trim().length < 20) {
      nextErrors.whyFrance = "Expliquez pourquoi vous voulez etudier en France.";
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
    setForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === "hasBaccalaureate" && value === "no") {
        next.baccalaureateYear = "";
        next.highSchoolYearCount = "";
        next.repeatedHighSchoolClass = "";
        next.baccalaureateAverage = "";
        next.baccalaureateTrack = "";
      }

      if (field === "hasLicence" && value === "no") {
        next.licenceYear = "";
        next.repeatedLicenceClass = "";
        next.licenceYearCount = "";
        next.licenceAverage = "";
        next.licenceField = "";
      }

      return next;
    });
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
          has_baccalaureate: form.hasBaccalaureate === "yes",
          baccalaureate_year:
            form.hasBaccalaureate === "yes" ? Number(form.baccalaureateYear) : null,
          high_school_year_count:
            form.hasBaccalaureate === "yes" ? Number(form.highSchoolYearCount) : null,
          repeated_high_school_class:
            form.hasBaccalaureate === "yes"
              ? form.repeatedHighSchoolClass === "yes"
              : null,
          baccalaureate_average:
            form.hasBaccalaureate === "yes" ? form.baccalaureateAverage.trim() : null,
          baccalaureate_track:
            form.hasBaccalaureate === "yes" ? form.baccalaureateTrack.trim() : null,
          has_licence: form.hasLicence === "yes",
          licence_year: form.hasLicence === "yes" ? Number(form.licenceYear) : null,
          repeated_licence_class:
            form.hasLicence === "yes" ? form.repeatedLicenceClass === "yes" : null,
          licence_year_count:
            form.hasLicence === "yes" ? Number(form.licenceYearCount) : null,
          licence_average: form.hasLicence === "yes" ? form.licenceAverage.trim() : null,
          licence_field: form.hasLicence === "yes" ? form.licenceField.trim() : null,
          has_master: form.hasMaster === "yes",
          study_level: form.studyLevel,
          target_project: form.targetProject,
          immigration_attempt_count: Number(form.immigrationAttemptCount),
          school_type: form.schoolType,
          current_activity: form.currentActivity.trim(),
          france_motivation: form.whyFrance.trim(),
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
          Repondez etape par etape. On recupere votre niveau reel, votre parcours
          academique et votre objectif avant de vous orienter vers le bon accompagnement.
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
            <BinaryChoice
              error={errors.hasBaccalaureate}
              field="hasBaccalaureate"
              label="Avez-vous le bac ?"
              onChange={(field, value) => updateField(field, value)}
              value={form.hasBaccalaureate}
              yesLabel="Oui, je l'ai"
              noLabel="Non, pas encore"
            />

            {form.hasBaccalaureate === "yes" ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="baccalaureateYear">
                      En quelle annee avez-vous eu le bac ?
                    </label>
                    <input
                      aria-invalid={Boolean(errors.baccalaureateYear)}
                      className="form-input"
                      id="baccalaureateYear"
                      max={currentYear + 1}
                      min="1950"
                      onChange={(event) => updateField("baccalaureateYear", event.target.value)}
                      placeholder="2023"
                      type="number"
                      value={form.baccalaureateYear}
                    />
                    {errors.baccalaureateYear ? (
                      <div className="form-error">{errors.baccalaureateYear}</div>
                    ) : null}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="highSchoolYearCount">
                      Combien d&apos;annees avez-vous faites au lycee ?
                    </label>
                    <input
                      aria-invalid={Boolean(errors.highSchoolYearCount)}
                      className="form-input"
                      id="highSchoolYearCount"
                      max="10"
                      min="1"
                      onChange={(event) => updateField("highSchoolYearCount", event.target.value)}
                      placeholder="3"
                      type="number"
                      value={form.highSchoolYearCount}
                    />
                    {errors.highSchoolYearCount ? (
                      <div className="form-error">{errors.highSchoolYearCount}</div>
                    ) : null}
                  </div>
                </div>

                <BinaryChoice
                  error={errors.repeatedHighSchoolClass}
                  field="repeatedHighSchoolClass"
                  label="Avez-vous redouble une classe du lycee ?"
                  onChange={(field, value) => updateField(field, value)}
                  value={form.repeatedHighSchoolClass}
                />

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="baccalaureateAverage">
                      Moyenne du bac
                    </label>
                    <input
                      aria-invalid={Boolean(errors.baccalaureateAverage)}
                      className="form-input"
                      id="baccalaureateAverage"
                      onChange={(event) => updateField("baccalaureateAverage", event.target.value)}
                      placeholder="12.5 / 20"
                      type="text"
                      value={form.baccalaureateAverage}
                    />
                    {errors.baccalaureateAverage ? (
                      <div className="form-error">{errors.baccalaureateAverage}</div>
                    ) : null}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="baccalaureateTrack">
                      Filiere du bac
                    </label>
                    <input
                      aria-invalid={Boolean(errors.baccalaureateTrack)}
                      className="form-input"
                      id="baccalaureateTrack"
                      onChange={(event) => updateField("baccalaureateTrack", event.target.value)}
                      placeholder="D, C, A4, scientifique, litteraire..."
                      type="text"
                      value={form.baccalaureateTrack}
                    />
                    {errors.baccalaureateTrack ? (
                      <div className="form-error">{errors.baccalaureateTrack}</div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="form-inline-note">
                Ce bloc s&apos;adapte si vous n&apos;avez pas encore obtenu le baccalaureat.
              </div>
            )}
          </>
        ) : null}

        {currentStep === 2 ? (
          <>
            <BinaryChoice
              error={errors.hasLicence}
              field="hasLicence"
              label="Avez-vous la licence ?"
              onChange={(field, value) => updateField(field, value)}
              value={form.hasLicence}
              yesLabel="Oui, licence obtenue"
              noLabel="Non"
            />

            {form.hasLicence === "yes" ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="licenceYear">
                      En quelle annee avez-vous obtenu la licence ?
                    </label>
                    <input
                      aria-invalid={Boolean(errors.licenceYear)}
                      className="form-input"
                      id="licenceYear"
                      max={currentYear + 1}
                      min="1950"
                      onChange={(event) => updateField("licenceYear", event.target.value)}
                      placeholder="2024"
                      type="number"
                      value={form.licenceYear}
                    />
                    {errors.licenceYear ? (
                      <div className="form-error">{errors.licenceYear}</div>
                    ) : null}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="licenceYearCount">
                      Combien d&apos;annees avez-vous dans le parcours licence ?
                    </label>
                    <input
                      aria-invalid={Boolean(errors.licenceYearCount)}
                      className="form-input"
                      id="licenceYearCount"
                      max="12"
                      min="1"
                      onChange={(event) => updateField("licenceYearCount", event.target.value)}
                      placeholder="3"
                      type="number"
                      value={form.licenceYearCount}
                    />
                    {errors.licenceYearCount ? (
                      <div className="form-error">{errors.licenceYearCount}</div>
                    ) : null}
                  </div>
                </div>

                <BinaryChoice
                  error={errors.repeatedLicenceClass}
                  field="repeatedLicenceClass"
                  label="Avez-vous repris une classe de la licence ?"
                  onChange={(field, value) => updateField(field, value)}
                  value={form.repeatedLicenceClass}
                />

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="licenceAverage">
                      Moyenne de la licence
                    </label>
                    <input
                      aria-invalid={Boolean(errors.licenceAverage)}
                      className="form-input"
                      id="licenceAverage"
                      onChange={(event) => updateField("licenceAverage", event.target.value)}
                      placeholder="13 / 20"
                      type="text"
                      value={form.licenceAverage}
                    />
                    {errors.licenceAverage ? (
                      <div className="form-error">{errors.licenceAverage}</div>
                    ) : null}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="licenceField">
                      Filiere ou parcours de licence
                    </label>
                    <input
                      aria-invalid={Boolean(errors.licenceField)}
                      className="form-input"
                      id="licenceField"
                      onChange={(event) => updateField("licenceField", event.target.value)}
                      placeholder="Droit, economie, informatique..."
                      type="text"
                      value={form.licenceField}
                    />
                    {errors.licenceField ? (
                      <div className="form-error">{errors.licenceField}</div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="form-inline-note">
                Les details licence sont affiches seulement si la licence est deja obtenue.
              </div>
            )}

            <BinaryChoice
              error={errors.hasMaster}
              field="hasMaster"
              label="Avez-vous un master ?"
              onChange={(field, value) => updateField(field, value)}
              value={form.hasMaster}
            />
          </>
        ) : null}

        {currentStep === 3 ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="studyLevel">
                  Niveau d&apos;etudes actuel / plus haut niveau
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
                {errors.studyLevel ? (
                  <div className="form-error">{errors.studyLevel}</div>
                ) : null}
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
                  Nombre d&apos;echecs deja rencontres dans la procedure
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

            <div className="form-group">
              <label className="form-label" htmlFor="currentActivity">
                Qu&apos;est-ce que vous faites actuellement ?
              </label>
              <textarea
                aria-invalid={Boolean(errors.currentActivity)}
                className="form-input"
                id="currentActivity"
                onChange={(event) => updateField("currentActivity", event.target.value)}
                placeholder="Etudiant, en emploi, en stage, en attente de reprise..."
                value={form.currentActivity}
              />
              {errors.currentActivity ? (
                <div className="form-error">{errors.currentActivity}</div>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="whyFrance">
                Pourquoi voulez-vous aller etudier en France ?
              </label>
              <textarea
                aria-invalid={Boolean(errors.whyFrance)}
                className="form-input"
                id="whyFrance"
                onChange={(event) => updateField("whyFrance", event.target.value)}
                placeholder="Expliquez votre objectif, votre projet d'etudes et ce que vous recherchez en France."
                value={form.whyFrance}
              />
              {errors.whyFrance ? <div className="form-error">{errors.whyFrance}</div> : null}
            </div>
          </>
        ) : null}

        {currentStep === 4 ? (
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

            <BinaryChoice
              error={errors.canInvest}
              field="canInvest"
              label="Pouvez-vous investir dans l'accompagnement et les frais du dossier ?"
              onChange={(field, value) => updateField(field, value)}
              value={form.canInvest}
              yesLabel="Oui, je peux investir"
              noLabel="Non, pas pour le moment"
            />
          </>
        ) : null}

        {currentStep === 5 ? (
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

        {currentStep === 6 ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="message">
                Blocages ou precisions complementaires
              </label>
              <textarea
                aria-invalid={Boolean(errors.message)}
                className="form-input"
                id="message"
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Ajoutez ici les details utiles: refus, contraintes, deadlines, choix d'ecoles, pieces manquantes..."
                value={form.message}
              />
              {errors.message ? <div className="form-error">{errors.message}</div> : null}
            </div>

            <div className="form-summary">
              <div className="form-summary-item">
                <span>Bac</span>
                <strong>
                  {form.hasBaccalaureate === "yes"
                    ? "Oui"
                    : form.hasBaccalaureate === "no"
                      ? "Non"
                      : "A preciser"}
                </strong>
              </div>
              <div className="form-summary-item">
                <span>Licence</span>
                <strong>
                  {form.hasLicence === "yes"
                    ? "Oui"
                    : form.hasLicence === "no"
                      ? "Non"
                      : "A preciser"}
                </strong>
              </div>
              <div className="form-summary-item">
                <span>Projet</span>
                <strong>{form.targetProject || "Non renseigne"}</strong>
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
