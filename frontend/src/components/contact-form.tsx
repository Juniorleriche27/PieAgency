"use client";

import { useMemo, useState } from "react";
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
  const [form, setForm] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

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

  function updateField<K extends keyof ContactFormState>(
    field: K,
    value: ContactFormState[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFeedback(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
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
    <form className="form-card" onSubmit={handleSubmit}>
      <h3>Envoyer une demande</h3>
      <p>Remplissez ce formulaire detaille et notre equipe vous recontactera.</p>

      {feedback ? (
        <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div>
      ) : null}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="firstName">
            Prenom
          </label>
          <input
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
            className="form-input"
            id="country"
            onChange={(event) => updateField("country", event.target.value)}
            placeholder="Votre pays de residence"
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

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="studyLevel">
            Niveau d&apos;etudes
          </label>
          <select
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

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="fundingSource">
            Qui financera vos etudes ?
          </label>
          <input
            className="form-input"
            id="fundingSource"
            onChange={(event) => updateField("fundingSource", event.target.value)}
            placeholder="Vous-meme, parent, garant..."
            type="text"
            value={form.fundingSource}
          />
          {errors.fundingSource ? (
            <div className="form-error">{errors.fundingSource}</div>
          ) : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="assistancePreference">
            Assistance souhaitee
          </label>
          <select
            className="form-input"
            id="assistancePreference"
            onChange={(event) =>
              updateField("assistancePreference", event.target.value)
            }
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
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="consultationDate">
            Date de consultation gratuite
          </label>
          <input
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

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="referrerName">
            Qui vous a envoye le lien du formulaire ?
          </label>
          <input
            className="form-input"
            id="referrerName"
            onChange={(event) => updateField("referrerName", event.target.value)}
            placeholder="Prenom ou numero de la personne"
            type="text"
            value={form.referrerName}
          />
          {errors.referrerName ? (
            <div className="form-error">{errors.referrerName}</div>
          ) : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="canInvest">
            Pouvez-vous investir dans l&apos;accompagnement ?
          </label>
          <select
            className="form-input"
            id="canInvest"
            onChange={(event) => updateField("canInvest", event.target.value)}
            value={form.canInvest}
          >
            <option value="">Selectionner...</option>
            <option value="yes">Oui</option>
            <option value="no">Non</option>
          </select>
          {errors.canInvest ? <div className="form-error">{errors.canInvest}</div> : null}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="message">
          Contexte et situation
        </label>
        <textarea
          className="form-input"
          id="message"
          onChange={(event) => updateField("message", event.target.value)}
          placeholder="Expliquez votre situation, vos blocages et ce que vous attendez de PieAgency..."
          value={form.message}
        />
        {errors.message ? <div className="form-error">{errors.message}</div> : null}
      </div>

      <label className="form-check">
        <input
          checked={form.consentResources}
          onChange={(event) => updateField("consentResources", event.target.checked)}
          type="checkbox"
        />
        <span>
          J&apos;accepte les conditions ci-dessus et je consens a recevoir les ressources
          gratuites.
        </span>
      </label>
      {errors.consentResources ? (
        <div className="form-error">{errors.consentResources}</div>
      ) : null}

      <button className="btn btn-primary btn-lg" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Envoi en cours..." : "Soumettre ma demande"}
      </button>

      <p className="form-note">
        Besoin d&apos;un echange direct ? Contactez-nous aussi sur{" "}
        <a href={company.contacts.togo.whatsappHref} rel="noreferrer" target="_blank">
          WhatsApp
        </a>
        .
      </p>
    </form>
  );
}
