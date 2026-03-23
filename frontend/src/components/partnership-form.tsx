"use client";

import { useMemo, useState } from "react";
import { getApiBaseUrl } from "@/lib/auth";

type PartnershipFormState = {
  organizationName: string;
  organizationType: string;
  contactFullName: string;
  contactRole: string;
  email: string;
  phone: string;
  country: string;
  website: string;
  partnershipScope: string;
  objectives: string;
  additionalNotes: string;
  consentContact: boolean;
};

type FormErrors = Partial<Record<keyof PartnershipFormState, string>>;

const organizationTypes = [
  "Universite",
  "Ecole",
  "Entreprise",
  "Association",
  "Institution publique",
  "Autre",
];

const partnershipScopes = [
  "Recrutement etudiant",
  "Visibilite et communication",
  "Evenement ou webinaire",
  "Representation locale",
  "Accord institutionnel",
  "Autre",
];

const initialState: PartnershipFormState = {
  organizationName: "",
  organizationType: "",
  contactFullName: "",
  contactRole: "",
  email: "",
  phone: "",
  country: "",
  website: "",
  partnershipScope: "",
  objectives: "",
  additionalNotes: "",
  consentContact: false,
};

export function PartnershipForm() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function updateField<K extends keyof PartnershipFormState>(
    field: K,
    value: PartnershipFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  }

  function validate(current: PartnershipFormState): FormErrors {
    const nextErrors: FormErrors = {};

    if (current.organizationName.trim().length < 2) {
      nextErrors.organizationName = "Le nom de l'organisation est requis.";
    }
    if (!current.organizationType) {
      nextErrors.organizationType = "Selectionnez le type d'organisation.";
    }
    if (current.contactFullName.trim().length < 2) {
      nextErrors.contactFullName = "Le nom du contact est requis.";
    }
    if (current.contactRole.trim().length < 2) {
      nextErrors.contactRole = "Le role du contact est requis.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())) {
      nextErrors.email = "L'email n'est pas valide.";
    }
    if (current.phone.trim().length < 6) {
      nextErrors.phone = "Le numero de contact est requis.";
    }
    if (current.country.trim().length < 2) {
      nextErrors.country = "Le pays est requis.";
    }
    if (!current.partnershipScope) {
      nextErrors.partnershipScope = "Selectionnez l'objet du partenariat.";
    }
    if (current.objectives.trim().length < 20) {
      nextErrors.objectives = "Detaillez davantage les objectifs du partenariat.";
    }
    if (!current.consentContact) {
      nextErrors.consentContact = "Le consentement de contact est requis.";
    }

    return nextErrors;
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
      const response = await fetch(`${apiBaseUrl}/api/partnership-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_name: form.organizationName.trim(),
          organization_type: form.organizationType,
          contact_full_name: form.contactFullName.trim(),
          contact_role: form.contactRole.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          website: form.website.trim() || null,
          partnership_scope: form.partnershipScope,
          objectives: form.objectives.trim(),
          additional_notes: form.additionalNotes.trim() || null,
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
            "Impossible d'envoyer cette demande de partenariat.",
        );
      }

      setForm(initialState);
      setFeedback({
        type: "success",
        message: "Votre demande de partenariat a bien ete envoyee.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant l'envoi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <h3>Proposer un partenariat</h3>
      <p>
        Universites, ecoles, institutions et partenaires peuvent nous soumettre ici
        une proposition de collaboration.
      </p>

      {feedback ? (
        <div className={`form-feedback ${feedback.type}`}>{feedback.message}</div>
      ) : null}

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="organizationName">
            Nom de l&apos;organisation
          </label>
          <input
            className="form-input"
            id="organizationName"
            onChange={(event) => updateField("organizationName", event.target.value)}
            type="text"
            value={form.organizationName}
          />
          {errors.organizationName ? (
            <div className="form-error">{errors.organizationName}</div>
          ) : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="organizationType">
            Type d&apos;organisation
          </label>
          <select
            className="form-input"
            id="organizationType"
            onChange={(event) => updateField("organizationType", event.target.value)}
            value={form.organizationType}
          >
            <option value="">Selectionner...</option>
            {organizationTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.organizationType ? (
            <div className="form-error">{errors.organizationType}</div>
          ) : null}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="contactFullName">
            Nom du contact
          </label>
          <input
            className="form-input"
            id="contactFullName"
            onChange={(event) => updateField("contactFullName", event.target.value)}
            type="text"
            value={form.contactFullName}
          />
          {errors.contactFullName ? (
            <div className="form-error">{errors.contactFullName}</div>
          ) : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="contactRole">
            Fonction / role
          </label>
          <input
            className="form-input"
            id="contactRole"
            onChange={(event) => updateField("contactRole", event.target.value)}
            type="text"
            value={form.contactRole}
          />
          {errors.contactRole ? <div className="form-error">{errors.contactRole}</div> : null}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="partnershipEmail">
            Email
          </label>
          <input
            className="form-input"
            id="partnershipEmail"
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            value={form.email}
          />
          {errors.email ? <div className="form-error">{errors.email}</div> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="partnershipPhone">
            Telephone
          </label>
          <input
            className="form-input"
            id="partnershipPhone"
            onChange={(event) => updateField("phone", event.target.value)}
            type="tel"
            value={form.phone}
          />
          {errors.phone ? <div className="form-error">{errors.phone}</div> : null}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="partnershipCountry">
            Pays
          </label>
          <input
            className="form-input"
            id="partnershipCountry"
            onChange={(event) => updateField("country", event.target.value)}
            type="text"
            value={form.country}
          />
          {errors.country ? <div className="form-error">{errors.country}</div> : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="website">
            Site web
          </label>
          <input
            className="form-input"
            id="website"
            onChange={(event) => updateField("website", event.target.value)}
            placeholder="https://..."
            type="url"
            value={form.website}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="partnershipScope">
          Objet du partenariat
        </label>
        <select
          className="form-input"
          id="partnershipScope"
          onChange={(event) => updateField("partnershipScope", event.target.value)}
          value={form.partnershipScope}
        >
          <option value="">Selectionner...</option>
          {partnershipScopes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.partnershipScope ? (
          <div className="form-error">{errors.partnershipScope}</div>
        ) : null}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="objectives">
          Objectifs du partenariat
        </label>
        <textarea
          className="form-input"
          id="objectives"
          onChange={(event) => updateField("objectives", event.target.value)}
          placeholder="Expliquez ce que vous souhaitez construire avec PieAgency..."
          value={form.objectives}
        />
        {errors.objectives ? <div className="form-error">{errors.objectives}</div> : null}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="additionalNotes">
          Informations complementaires
        </label>
        <textarea
          className="form-input"
          id="additionalNotes"
          onChange={(event) => updateField("additionalNotes", event.target.value)}
          placeholder="Precisions supplementaires, calendrier, attentes..."
          value={form.additionalNotes}
        />
      </div>

      <label className="form-check">
        <input
          checked={form.consentContact}
          onChange={(event) => updateField("consentContact", event.target.checked)}
          type="checkbox"
        />
        <span>J&apos;autorise PieAgency a me recontacter au sujet de ce partenariat.</span>
      </label>
      {errors.consentContact ? (
        <div className="form-error">{errors.consentContact}</div>
      ) : null}

      <button className="btn btn-primary btn-lg" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
      </button>
    </form>
  );
}
