"use client";

import { useMemo, useRef, useState } from "react";
import { getApiBaseUrl } from "@/lib/auth";

type ChoiceValue = "" | "yes" | "no";
type RespondentTypeValue = "Etudiant" | "Parent";
type StudyLevelValue =
  | "Baccalaureat"
  | "Licence / Bachelor"
  | "Master"
  | "Doctorat"
  | "Autre";
type SchoolTypeValue =
  | "Ecole de commerce"
  | "Ecole d'ingenieur"
  | "Universite privee"
  | "Universite publique"
  | "Je reflechis pour le moment";
type AssistancePreferenceValue =
  | "Diagnostic complet du projet"
  | "Accompagnement Campus France"
  | "Accompagnement procedure visa"
  | "Accompagnement Belgique"
  | "Accompagnement Parcoursup"
  | "Accompagnement ecoles privees"
  | "Coaching et relecture de dossier";

type ContactFormState = {
  respondentType: RespondentTypeValue | "";
  respondentFullName: string;
  studentFullName: string;
  phone: string;
  email: string;
  country: string;
  lastDegree: StudyLevelValue | "";
  schoolType: SchoolTypeValue | "";
  targetProject: string;
  assistancePreference: AssistancePreferenceValue | "";
  fundingSource: string;
  financialSituation: string;
  guarantorInformed: ChoiceValue;
  guarantorFullName: string;
  guarantorPhone: string;
  referrerName: string;
  consultationDate: string;
  consultationTime: string;
  consentContact: boolean;
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

const respondentOptions: ChoiceOption<RespondentTypeValue>[] = [
  { value: "Etudiant", label: "Je suis l'etudiant" },
  { value: "Parent", label: "Je suis un parent" },
];

const degreeOptions: ChoiceOption<StudyLevelValue>[] = [
  { value: "Baccalaureat", label: "Baccalaureat" },
  { value: "Licence / Bachelor", label: "Licence / Bachelor" },
  { value: "Master", label: "Master" },
  { value: "Doctorat", label: "Doctorat" },
  { value: "Autre", label: "Autre" },
];

const schoolTypeOptions: ChoiceOption<SchoolTypeValue>[] = [
  { value: "Ecole de commerce", label: "Ecole de commerce" },
  { value: "Ecole d'ingenieur", label: "Ecole d'ingenieur" },
  { value: "Universite privee", label: "Universite privee" },
  { value: "Universite publique", label: "Universite publique" },
  { value: "Je reflechis pour le moment", label: "Je reflechis pour le moment" },
];

const assistanceOptions: ChoiceOption<AssistancePreferenceValue>[] = [
  { value: "Diagnostic complet du projet", label: "Diagnostic complet du projet" },
  { value: "Accompagnement Campus France", label: "Accompagnement Campus France" },
  { value: "Accompagnement procedure visa", label: "Accompagnement procedure visa" },
  { value: "Accompagnement Belgique", label: "Accompagnement Belgique" },
  { value: "Accompagnement Parcoursup", label: "Accompagnement Parcoursup" },
  { value: "Accompagnement ecoles privees", label: "Accompagnement ecoles privees" },
  { value: "Coaching et relecture de dossier", label: "Coaching et relecture de dossier" },
];

const binaryOptions: ChoiceOption<Exclude<ChoiceValue, "">>[] = [
  { value: "yes", label: "Oui" },
  { value: "no", label: "Non" },
];

const steps: StepDefinition[] = [
  {
    title: "Coordonnees",
    description:
      "Identifiez le repondant, l'etudiant concerne et les coordonnees de contact.",
    fields: [
      "respondentType",
      "respondentFullName",
      "studentFullName",
      "phone",
      "email",
      "country",
    ],
  },
  {
    title: "Parcours",
    description:
      "Precisez le dernier diplome obtenu, le type d'ecole vise et la formation recherchee.",
    fields: ["lastDegree", "schoolType", "targetProject"],
  },
  {
    title: "Assistance",
    description:
      "Indiquez le type d'assistance souhaite, le financement et la situation financiere actuelle.",
    fields: ["assistancePreference", "fundingSource", "financialSituation"],
  },
  {
    title: "Garant",
    description:
      "Renseignez le statut du garant, ses coordonnees et l'origine du lien du formulaire.",
    fields: ["guarantorInformed", "guarantorFullName", "guarantorPhone", "referrerName"],
  },
  {
    title: "Consultation",
    description: "Choisissez la date et l'heure souhaitees pour le RDV a distance.",
    fields: ["consultationDate", "consultationTime"],
  },
  {
    title: "Validation",
    description: "Validez simplement le consentement de contact avant l'envoi.",
    fields: ["consentContact"],
  },
];

const initialState: ContactFormState = {
  respondentType: "",
  respondentFullName: "",
  studentFullName: "",
  phone: "",
  email: "",
  country: "",
  lastDegree: "",
  schoolType: "",
  targetProject: "",
  assistancePreference: "",
  fundingSource: "",
  financialSituation: "",
  guarantorInformed: "",
  guarantorFullName: "",
  guarantorPhone: "",
  referrerName: "",
  consultationDate: "",
  consultationTime: "",
  consentContact: false,
};

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

function derivePhoneCountryCode(phone: string) {
  const normalized = phone.trim().replace(/\s+/g, "");
  const match = normalized.match(/^(\+\d{1,4})/);
  return match?.[1] ?? "+228";
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

    if (!current.respondentType) {
      nextErrors.respondentType = "Precisez qui remplit ce formulaire.";
    }
    if (current.respondentFullName.trim().length < 3) {
      nextErrors.respondentFullName = "Entrez le nom complet du repondant.";
    }
    if (current.respondentType === "Parent" && current.studentFullName.trim().length < 3) {
      nextErrors.studentFullName = "Entrez le nom complet de l'etudiant concerne.";
    }
    if (current.phone.trim().length < 6) {
      nextErrors.phone = "Entrez le numero de telephone / WhatsApp.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())) {
      nextErrors.email = "L'adresse e-mail n'est pas valide.";
    }
    if (current.country.trim().length < 2) {
      nextErrors.country = "Entrez le pays de residence.";
    }
    if (!current.lastDegree) {
      nextErrors.lastDegree = "Selectionnez le dernier diplome obtenu.";
    }
    if (!current.schoolType) {
      nextErrors.schoolType = "Selectionnez le type d'ecole vise.";
    }
    if (current.targetProject.trim().length < 4) {
      nextErrors.targetProject = "Precisez le projet vise ou la formation recherchee.";
    }
    if (!current.assistancePreference) {
      nextErrors.assistancePreference = "Choisissez le type d'assistance souhaite.";
    }
    if (current.fundingSource.trim().length < 2) {
      nextErrors.fundingSource = "Indiquez qui financera les etudes en France.";
    }
    if (current.financialSituation.trim().length < 4) {
      nextErrors.financialSituation = "Precisez la situation financiere actuelle.";
    }
    if (!binaryOptions.some((option) => option.value === current.guarantorInformed)) {
      nextErrors.guarantorInformed = "Precisez si le garant est deja informe.";
    }
    if (current.guarantorFullName.trim().length < 3) {
      nextErrors.guarantorFullName = "Indiquez le nom complet du garant.";
    }
    if (current.guarantorPhone.trim().length < 6) {
      nextErrors.guarantorPhone = "Indiquez le numero du garant.";
    }
    if (current.referrerName.trim().length < 2) {
      nextErrors.referrerName = "Indiquez qui vous a envoye le lien du formulaire.";
    }
    if (!current.consultationDate) {
      nextErrors.consultationDate = "Choisissez la date de consultation / RDV.";
    }
    if (!current.consultationTime) {
      nextErrors.consultationTime = "Choisissez l'heure de consultation.";
    }
    if (!current.consentContact) {
      nextErrors.consentContact = "Le consentement de contact est requis.";
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
      const normalizedStudentFullName =
        form.respondentType === "Parent"
          ? form.studentFullName.trim()
          : form.studentFullName.trim() || form.respondentFullName.trim();
      const studentName = normalizedStudentFullName || form.respondentFullName.trim();
      const { firstName, lastName } = splitFullName(studentName);

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
          respondent_type: form.respondentType,
          respondent_full_name: form.respondentFullName.trim(),
          student_full_name: normalizedStudentFullName || null,
          study_level: form.lastDegree,
          school_type: form.schoolType,
          target_project: form.targetProject.trim(),
          assistance_preference: form.assistancePreference,
          funding_source: form.fundingSource.trim(),
          financial_situation: form.financialSituation.trim(),
          guarantor_informed: form.guarantorInformed === "yes",
          guarantor_full_name: form.guarantorFullName.trim(),
          guarantor_phone: form.guarantorPhone.trim(),
          referrer_name: form.referrerName.trim(),
          consultation_date: form.consultationDate,
          consultation_time: form.consultationTime,
          consent_contact: form.consentContact,
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
              <label className="form-label">Qui remplit ce formulaire ?</label>
              <CompactChoiceGroup
                error={errors.respondentType}
                onSelect={(value) => updateField("respondentType", value)}
                options={respondentOptions}
                value={form.respondentType}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="respondentFullName">
                Nom complet du r&eacute;pondant
              </label>
              <input
                aria-invalid={Boolean(errors.respondentFullName)}
                className="form-input"
                id="respondentFullName"
                onChange={(event) => updateField("respondentFullName", event.target.value)}
                placeholder="Nom complet du repondant"
                type="text"
                value={form.respondentFullName}
              />
              {errors.respondentFullName ? (
                <div className="form-error">{errors.respondentFullName}</div>
              ) : null}
            </div>

            {form.respondentType === "Parent" ? (
              <div className="form-group">
                <label className="form-label" htmlFor="studentFullName">
                  Nom complet de l&apos;&eacute;tudiant concern&eacute;
                </label>
                <input
                  aria-invalid={Boolean(errors.studentFullName)}
                  className="form-input"
                  id="studentFullName"
                  onChange={(event) => updateField("studentFullName", event.target.value)}
                  placeholder="Nom complet de l'etudiant"
                  type="text"
                  value={form.studentFullName}
                />
                {errors.studentFullName ? (
                  <div className="form-error">{errors.studentFullName}</div>
                ) : null}
              </div>
            ) : null}

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                T&eacute;l&eacute;phone / WhatsApp
              </label>
              <input
                aria-invalid={Boolean(errors.phone)}
                className="form-input"
                id="phone"
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+22899159953"
                type="tel"
                value={form.phone}
              />
              {errors.phone ? <div className="form-error">{errors.phone}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Adresse e-mail
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
                Pays de r&eacute;sidence
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
          <div className="form-compact-fields">
            <div className="form-group">
              <label className="form-label">Dernier dipl&ocirc;me obtenu</label>
              <CompactChoiceGroup
                error={errors.lastDegree}
                onSelect={(value) => updateField("lastDegree", value)}
                options={degreeOptions}
                value={form.lastDegree}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="schoolType">
                Quel type d&apos;&eacute;cole visez-vous ?
              </label>
              <select
                aria-invalid={Boolean(errors.schoolType)}
                className="form-input"
                id="schoolType"
                onChange={(event) =>
                  updateField("schoolType", event.target.value as SchoolTypeValue | "")
                }
                value={form.schoolType}
              >
                <option value="">Selectionner...</option>
                {schoolTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.schoolType ? <div className="form-error">{errors.schoolType}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="targetProject">
                Projet vis&eacute; / formation recherch&eacute;e
              </label>
              <textarea
                aria-invalid={Boolean(errors.targetProject)}
                className="form-input"
                id="targetProject"
                onChange={(event) => updateField("targetProject", event.target.value)}
                placeholder="Ex: Master en data science, ecole d'ingenieur, Campus France..."
                rows={3}
                value={form.targetProject}
              />
              {errors.targetProject ? (
                <div className="form-error">{errors.targetProject}</div>
              ) : null}
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="form-compact-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="assistancePreference">
                Quel type d&apos;assistance souhaitez-vous ?
              </label>
              <select
                aria-invalid={Boolean(errors.assistancePreference)}
                className="form-input"
                id="assistancePreference"
                onChange={(event) =>
                  updateField(
                    "assistancePreference",
                    event.target.value as AssistancePreferenceValue | "",
                  )
                }
                value={form.assistancePreference}
              >
                <option value="">Selectionner...</option>
                {assistanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.assistancePreference ? (
                <div className="form-error">{errors.assistancePreference}</div>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fundingSource">
                Qui financera les &eacute;tudes en France ?
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

            <div className="form-group">
              <label className="form-label" htmlFor="financialSituation">
                Situation financi&egrave;re actuelle
              </label>
              <textarea
                aria-invalid={Boolean(errors.financialSituation)}
                className="form-input"
                id="financialSituation"
                onChange={(event) => updateField("financialSituation", event.target.value)}
                placeholder="Precisez votre situation financiere actuelle en quelques mots."
                rows={3}
                value={form.financialSituation}
              />
              {errors.financialSituation ? (
                <div className="form-error">{errors.financialSituation}</div>
              ) : null}
            </div>
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="form-compact-fields">
            <div className="form-group">
              <label className="form-label">Le garant est-il d&eacute;j&agrave; inform&eacute; ?</label>
              <CompactChoiceGroup
                error={errors.guarantorInformed}
                onSelect={(value) => updateField("guarantorInformed", value)}
                options={binaryOptions}
                value={form.guarantorInformed}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="guarantorFullName">
                Nom complet du garant
              </label>
              <input
                aria-invalid={Boolean(errors.guarantorFullName)}
                className="form-input"
                id="guarantorFullName"
                onChange={(event) => updateField("guarantorFullName", event.target.value)}
                placeholder="Nom complet du garant"
                type="text"
                value={form.guarantorFullName}
              />
              {errors.guarantorFullName ? (
                <div className="form-error">{errors.guarantorFullName}</div>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="guarantorPhone">
                Num&eacute;ro du garant
              </label>
              <input
                aria-invalid={Boolean(errors.guarantorPhone)}
                className="form-input"
                id="guarantorPhone"
                onChange={(event) => updateField("guarantorPhone", event.target.value)}
                placeholder="+22890000000"
                type="tel"
                value={form.guarantorPhone}
              />
              {errors.guarantorPhone ? (
                <div className="form-error">{errors.guarantorPhone}</div>
              ) : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="referrerName">
                Qui vous a envoy&eacute; le lien du formulaire ?
              </label>
              <input
                aria-invalid={Boolean(errors.referrerName)}
                className="form-input"
                id="referrerName"
                onChange={(event) => updateField("referrerName", event.target.value)}
                placeholder="Nom, conseiller, ami, parent..."
                type="text"
                value={form.referrerName}
              />
              {errors.referrerName ? <div className="form-error">{errors.referrerName}</div> : null}
            </div>
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div className="form-compact-fields">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="consultationDate">
                  Date de consultation / RDV
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
                  Heure de consultation
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
          </div>
        ) : null}

        {currentStep === 5 ? (
          <div className="form-compact-fields">
            <label className="form-check form-compact-check">
              <input
                checked={form.consentContact}
                onChange={(event) => updateField("consentContact", event.target.checked)}
                type="checkbox"
              />
              <span>
                J&apos;accepte d&apos;&ecirc;tre recontact&eacute;(e) par PieAgency.
              </span>
            </label>
            {errors.consentContact ? (
              <div className="form-error">{errors.consentContact}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="form-compact-footer">
        <div className="form-compact-note">
          Le formulaire reste le canal principal. Le chat du site reste disponible pour
          les questions immediates.
          <button
            className="form-compact-note-button"
            onClick={() => window.dispatchEvent(new CustomEvent("pieagency-chat-open"))}
            type="button"
          >
            Ouvrir le chat
          </button>
        </div>
        <div className="form-compact-actions">
          <button
            className="btn btn-outline-white"
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
