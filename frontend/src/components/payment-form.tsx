"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { servicePages } from "@/content/site";
import { getApiBaseUrl } from "@/lib/auth";

type PaymentConfig = {
  enabled: boolean;
  provider: "makuta";
  merchant_label: string;
  currency_options: string[];
  operator_options: Array<{ code: string; label: string }>;
  instructions: string;
  status_check_enabled: boolean;
};

type PaymentResponse = {
  provider: "makuta";
  status: "initiated" | "pending" | "success" | "failed" | "unknown";
  message: string;
  transaction_id?: string | null;
  reference?: string | null;
  provider_status?: string | null;
  status_check_enabled: boolean;
};

type PaymentStatusResponse = {
  provider: "makuta";
  transaction_id: string;
  status: "pending" | "success" | "failed" | "unknown";
  message: string;
  provider_status?: string | null;
  reference?: string | null;
};

type PaymentFormState = {
  fullName: string;
  email: string;
  phone: string;
  accountNumber: string;
  operatorCode: string;
  amount: string;
  currency: string;
  serviceSlug: string;
  dossierReference: string;
  reason: string;
};

type PaymentFormErrors = Partial<Record<keyof PaymentFormState, string>>;

const serviceOptions = servicePages.map((service) => ({
  slug: service.slug,
  label: service.shortTitle,
}));

const initialState: PaymentFormState = {
  fullName: "",
  email: "",
  phone: "",
  accountNumber: "",
  operatorCode: "",
  amount: "",
  currency: "XOF",
  serviceSlug: "",
  dossierReference: "",
  reason: "Acompte convenu avec PieAgency",
};

function getServiceReason(serviceSlug: string) {
  const service = serviceOptions.find((item) => item.slug === serviceSlug);
  return service ? `Acompte convenu pour ${service.label}` : "Acompte convenu avec PieAgency";
}

export function PaymentForm() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const searchParams = useSearchParams();
  const serviceFromQuery = searchParams.get("service") ?? "";
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [form, setForm] = useState<PaymentFormState>(initialState);
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [statusResult, setStatusResult] = useState<PaymentStatusResponse | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    const matchedService = serviceOptions.find((item) => item.slug === serviceFromQuery);
    if (!matchedService) {
      return;
    }

    setForm((current) => {
      const shouldUpdateReason =
        !current.reason.trim() ||
        current.reason === initialState.reason ||
        current.reason === getServiceReason(current.serviceSlug);

      return {
        ...current,
        serviceSlug: matchedService.slug,
        reason: shouldUpdateReason ? getServiceReason(matchedService.slug) : current.reason,
      };
    });
  }, [serviceFromQuery]);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/payments/config`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Impossible de charger la configuration de paiement.");
        }

        const payload = (await response.json()) as PaymentConfig;
        if (!isMounted) {
          return;
        }

        setConfig(payload);
        setForm((current) => ({
          ...current,
          currency: payload.currency_options[0] ?? current.currency,
          operatorCode:
            current.operatorCode || payload.operator_options[0]?.code || current.operatorCode,
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de charger le paiement pour le moment.",
        });
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      }
    }

    void loadConfig();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  function updateField<K extends keyof PaymentFormState>(
    field: K,
    value: PaymentFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback(null);
  }

  function validate(current: PaymentFormState): PaymentFormErrors {
    const nextErrors: PaymentFormErrors = {};

    if (current.fullName.trim().length < 3) {
      nextErrors.fullName = "Entrez votre nom complet.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())) {
      nextErrors.email = "L'email n'est pas valide.";
    }
    if (current.phone.trim().length < 6) {
      nextErrors.phone = "Indiquez votre numero principal.";
    }
    if (current.accountNumber.trim().length < 6) {
      nextErrors.accountNumber = "Indiquez le numero lie au moyen de paiement.";
    }
    if (current.operatorCode.trim().length < 2) {
      nextErrors.operatorCode = "Selectionnez ou renseignez l'operateur.";
    }

    const amountValue = Number(current.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      nextErrors.amount = "Entrez un montant valide.";
    }

    if (current.currency.trim().length !== 3) {
      nextErrors.currency = "La devise doit contenir 3 lettres.";
    }
    if (current.reason.trim().length < 4) {
      nextErrors.reason = "Precisez l'objet du paiement.";
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

    if (!config?.enabled) {
      setFeedback({
        type: "info",
        message:
          "Le paiement en ligne n'est pas encore active sur ce backend. Ajoutez les identifiants Makuta dans Render.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setPaymentResult(null);
    setStatusResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/payments/makuta/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          account_number: form.accountNumber.trim(),
          operator_code: form.operatorCode.trim(),
          amount: Number(form.amount),
          currency: form.currency.trim().toUpperCase(),
          service_slug: form.serviceSlug || null,
          dossier_reference: form.dossierReference.trim() || null,
          reason: form.reason.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ({ detail?: string } & PaymentResponse)
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.detail ?? "Impossible d'initier le paiement pour le moment.",
        );
      }
      if (!payload) {
        throw new Error("Makuta n'a pas retourne de reponse exploitable.");
      }

      setPaymentResult(payload);
      setFeedback({
        type: "success",
        message: payload.message,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant l'initiation du paiement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCheckStatus() {
    if (!paymentResult?.transaction_id) {
      return;
    }

    setIsCheckingStatus(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/payments/makuta/transactions/${encodeURIComponent(
          paymentResult.transaction_id,
        )}`,
        {
          cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | ({ detail?: string } & PaymentStatusResponse)
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.detail ?? "Impossible de verifier le statut du paiement.",
        );
      }

      setStatusResult(payload);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de verifier le statut du paiement.",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  }

  const currentService = serviceOptions.find((item) => item.slug === form.serviceSlug);
  const operatorOptions = config?.operator_options ?? [];
  const currencyOptions = config?.currency_options.length ? config.currency_options : ["XOF"];

  return (
    <div className="payment-layout">
      <div className="payment-info-card">
        <div className="section-label">Paiement Makuta</div>
        <h2 className="section-title">Payer un acompte ou un montant valide avec PieAgency</h2>
        <p className="section-lead compact">
          Cette page sert uniquement a regler un montant deja valide avec un conseiller.
          Aucun tarif automatique n&apos;est applique sur le site.
        </p>

        <div className="payment-step-list">
          <div className="payment-step-item">
            <span>1</span>
            <div>
              <strong>Renseignez le montant convenu</strong>
              <p>Utilisez le meme montant que celui confirme par PieAgency.</p>
            </div>
          </div>
          <div className="payment-step-item">
            <span>2</span>
            <div>
              <strong>Choisissez l&apos;operateur Makuta</strong>
              <p>Le numero de paiement doit etre lie au moyen de paiement utilise.</p>
            </div>
          </div>
          <div className="payment-step-item">
            <span>3</span>
            <div>
              <strong>Validez sur votre telephone</strong>
              <p>Apres soumission, confirmez la demande de paiement sur votre appareil.</p>
            </div>
          </div>
        </div>

        <div className="payment-note-card">
          <div className="payment-note-kicker">Configuration</div>
          <p>{config?.instructions ?? "Chargement de la configuration de paiement..."}</p>
          {currentService ? (
            <div className="payment-service-pill">Service preselectionne : {currentService.label}</div>
          ) : null}
        </div>
      </div>

      <form className="form-card payment-form-card" onSubmit={handleSubmit}>
        <div className="payment-form-head">
          <div>
            <div className="section-label">Formulaire de paiement</div>
            <h3>Paiement securise</h3>
          </div>
          <div className={`payment-badge ${config?.enabled ? "is-live" : "is-disabled"}`}>
            {config?.enabled ? "Actif" : isLoadingConfig ? "Chargement" : "Indisponible"}
          </div>
        </div>

        {feedback ? (
          <div className={`form-feedback ${feedback.type === "info" ? "success" : feedback.type}`}>
            {feedback.message}
          </div>
        ) : null}

        <div className="payment-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="payment-full-name">
              Nom complet
            </label>
            <input
              aria-invalid={Boolean(errors.fullName)}
              className="form-input"
              id="payment-full-name"
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Nom et prenom"
              type="text"
              value={form.fullName}
            />
            {errors.fullName ? <div className="form-error">{errors.fullName}</div> : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payment-email">
              Email
            </label>
            <input
              aria-invalid={Boolean(errors.email)}
              className="form-input"
              id="payment-email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="vous@email.com"
              type="email"
              value={form.email}
            />
            {errors.email ? <div className="form-error">{errors.email}</div> : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payment-phone">
              Numero principal
            </label>
            <input
              aria-invalid={Boolean(errors.phone)}
              className="form-input"
              id="payment-phone"
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+228 90 00 00 00"
              type="tel"
              value={form.phone}
            />
            {errors.phone ? <div className="form-error">{errors.phone}</div> : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payment-account-number">
              Numero lie au paiement
            </label>
            <input
              aria-invalid={Boolean(errors.accountNumber)}
              className="form-input"
              id="payment-account-number"
              onChange={(event) => updateField("accountNumber", event.target.value)}
              placeholder="+228 90 00 00 00"
              type="tel"
              value={form.accountNumber}
            />
            {errors.accountNumber ? (
              <div className="form-error">{errors.accountNumber}</div>
            ) : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payment-service">
              Service concerne
            </label>
            <select
              className="form-input"
              id="payment-service"
              onChange={(event) => {
                const nextServiceSlug = event.target.value;
                const shouldUpdateReason =
                  !form.reason.trim() ||
                  form.reason === initialState.reason ||
                  form.reason === getServiceReason(form.serviceSlug);
                updateField("serviceSlug", nextServiceSlug);
                if (shouldUpdateReason) {
                  updateField("reason", getServiceReason(nextServiceSlug));
                }
              }}
              value={form.serviceSlug}
            >
              <option value="">Montant libre / acompte general</option>
              {serviceOptions.map((service) => (
                <option key={service.slug} value={service.slug}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payment-reference">
              Reference dossier
            </label>
            <input
              className="form-input"
              id="payment-reference"
              onChange={(event) => updateField("dossierReference", event.target.value)}
              placeholder="Ex: PIE-2026-014"
              type="text"
              value={form.dossierReference}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payment-amount">
              Montant convenu
            </label>
            <input
              aria-invalid={Boolean(errors.amount)}
              className="form-input"
              id="payment-amount"
              min="1"
              onChange={(event) => updateField("amount", event.target.value)}
              placeholder="Ex: 75000"
              step="0.01"
              type="number"
              value={form.amount}
            />
            {errors.amount ? <div className="form-error">{errors.amount}</div> : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payment-currency">
              Devise
            </label>
            <select
              aria-invalid={Boolean(errors.currency)}
              className="form-input"
              id="payment-currency"
              onChange={(event) => updateField("currency", event.target.value)}
              value={form.currency}
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {errors.currency ? <div className="form-error">{errors.currency}</div> : null}
          </div>

          <div className="form-group payment-operator-field">
            <label className="form-label" htmlFor="payment-operator">
              Operateur Makuta
            </label>
            {operatorOptions.length ? (
              <select
                aria-invalid={Boolean(errors.operatorCode)}
                className="form-input"
                id="payment-operator"
                onChange={(event) => updateField("operatorCode", event.target.value)}
                value={form.operatorCode}
              >
                <option value="">Selectionnez un operateur</option>
                {operatorOptions.map((operator) => (
                  <option key={operator.code} value={operator.code}>
                    {operator.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-invalid={Boolean(errors.operatorCode)}
                className="form-input"
                id="payment-operator"
                onChange={(event) => updateField("operatorCode", event.target.value)}
                placeholder="Code ou nom operateur Makuta"
                type="text"
                value={form.operatorCode}
              />
            )}
            {errors.operatorCode ? (
              <div className="form-error">{errors.operatorCode}</div>
            ) : null}
          </div>

          <div className="form-group payment-reason-field">
            <label className="form-label" htmlFor="payment-reason">
              Objet du paiement
            </label>
            <textarea
              aria-invalid={Boolean(errors.reason)}
              className="form-input"
              id="payment-reason"
              onChange={(event) => updateField("reason", event.target.value)}
              placeholder="Acompte convenu pour votre accompagnement"
              rows={3}
              value={form.reason}
            />
            {errors.reason ? <div className="form-error">{errors.reason}</div> : null}
          </div>
        </div>

        <div className="payment-form-footer">
          <div className="payment-footnote">
            Le paiement en ligne ne remplace pas le diagnostic. Il sert a regler un montant
            deja confirme avec PieAgency.
          </div>
          <button className="btn btn-primary btn-lg" disabled={isSubmitting || isLoadingConfig} type="submit">
            {isSubmitting ? "Connexion Makuta..." : "Initier le paiement"}
          </button>
        </div>

        {paymentResult ? (
          <div className="payment-status-card">
            <div className="payment-status-head">
              <div>
                <div className="payment-note-kicker">Transaction envoyee</div>
                <h4>Suivi du paiement</h4>
              </div>
              <div className={`payment-status-pill is-${paymentResult.status}`}>
                {paymentResult.status}
              </div>
            </div>
            <div className="payment-status-grid">
              <div>
                <span>Transaction</span>
                <strong>{paymentResult.transaction_id ?? "Non retournee"}</strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{paymentResult.reference ?? "Non retournee"}</strong>
              </div>
              <div>
                <span>Statut Makuta</span>
                <strong>{paymentResult.provider_status ?? "En attente"}</strong>
              </div>
            </div>
            {paymentResult.status_check_enabled && paymentResult.transaction_id ? (
              <button
                className="btn btn-outline"
                disabled={isCheckingStatus}
                onClick={handleCheckStatus}
                type="button"
              >
                {isCheckingStatus ? "Verification..." : "Verifier le statut"}
              </button>
            ) : null}
          </div>
        ) : null}

        {statusResult ? (
          <div className="payment-status-card is-secondary">
            <div className="payment-status-head">
              <div>
                <div className="payment-note-kicker">Derniere verification</div>
                <h4>Statut courant</h4>
              </div>
              <div className={`payment-status-pill is-${statusResult.status}`}>
                {statusResult.status}
              </div>
            </div>
            <p>{statusResult.message}</p>
            <div className="payment-status-grid">
              <div>
                <span>Transaction</span>
                <strong>{statusResult.transaction_id}</strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{statusResult.reference ?? "Non retournee"}</strong>
              </div>
              <div>
                <span>Statut Makuta</span>
                <strong>{statusResult.provider_status ?? "Inconnu"}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
