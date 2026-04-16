"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { servicePages } from "@/content/site";
import { getApiBaseUrl } from "@/lib/auth";

type PaymentConfig = {
  enabled: boolean;
  provider: "maketou";
  merchant_label: string;
  display_currency: string;
  instructions: string;
  status_check_enabled: boolean;
};

type PaymentResponse = {
  provider: "maketou";
  status: "waiting_payment" | "completed" | "abandoned" | "payment_failed" | "unknown";
  message: string;
  cart_id?: string | null;
  redirect_url?: string | null;
  payment_id?: string | null;
  reference?: string | null;
  status_check_enabled: boolean;
};

type PaymentStatusResponse = {
  provider: "maketou";
  cart_id: string;
  status: "waiting_payment" | "completed" | "abandoned" | "payment_failed" | "unknown";
  message: string;
  payment_id?: string | null;
  reference?: string | null;
};

type PaymentFormState = {
  fullName: string;
  email: string;
  phone: string;
  amount: string;
  serviceSlug: string;
  dossierReference: string;
  reason: string;
};

type PaymentFormErrors = Partial<Record<keyof PaymentFormState, string>>;

const LAST_CHECKOUT_STORAGE_KEY = "pieagency.payment.lastCheckout";

const serviceOptions = servicePages.map((service) => ({
  slug: service.slug,
  label: service.shortTitle,
}));

const initialState: PaymentFormState = {
  fullName: "",
  email: "",
  phone: "",
  amount: "",
  serviceSlug: "",
  dossierReference: "",
  reason: "Acompte convenu avec PieAgency",
};

function getServiceReason(serviceSlug: string) {
  const service = serviceOptions.find((item) => item.slug === serviceSlug);
  return service ? `Acompte convenu pour ${service.label}` : "Acompte convenu avec PieAgency";
}

function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "";
  }

  const compact = trimmed.replace(/[\s().-]+/g, "");
  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`;
  }
  return compact;
}

function isInternationalPhone(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export function PaymentForm() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const searchParams = useSearchParams();
  const serviceFromQuery = searchParams.get("service") ?? "";
  const checkoutReturn = searchParams.get("checkout") === "return";
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
    const normalizedPhone = normalizePhone(current.phone);

    if (current.fullName.trim().length < 3) {
      nextErrors.fullName = "Entrez votre nom complet.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())) {
      nextErrors.email = "L'email n'est pas valide.";
    }
    if (!normalizedPhone) {
      nextErrors.phone = "Indiquez votre numero principal.";
    } else if (!isInternationalPhone(normalizedPhone)) {
      nextErrors.phone =
        "Utilisez un numero au format international, par exemple +22899159953.";
    }

    const amountValue = Number(current.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      nextErrors.amount = "Entrez un montant valide.";
    }
    if (current.reason.trim().length < 4) {
      nextErrors.reason = "Precisez l'objet du paiement.";
    }

    return nextErrors;
  }

  const checkStatus = useCallback(async (cartId: string) => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/payments/maketou/carts/${encodeURIComponent(cartId)}`,
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
      if (!payload) {
        throw new Error("MakeTou n'a pas retourne de statut exploitable.");
      }

      setStatusResult(payload);

      if (
        typeof window !== "undefined" &&
        ["completed", "abandoned", "payment_failed"].includes(payload.status)
      ) {
        window.localStorage.removeItem(LAST_CHECKOUT_STORAGE_KEY);
      }

      // Send receipt email when payment is confirmed
      if (payload.status === "completed") {
        const savedRaw = typeof window !== "undefined"
          ? window.localStorage.getItem("pieagency.payment.lastForm")
          : null;
        const savedForm = savedRaw ? (JSON.parse(savedRaw) as PaymentFormState) : null;
        if (savedForm?.email) {
          const serviceLabel = savedForm.serviceSlug
            ? (serviceOptions.find((s) => s.slug === savedForm.serviceSlug)?.label ?? savedForm.reason)
            : savedForm.reason;
          fetch(`${apiBaseUrl}/api/payments/receipt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: savedForm.email,
              full_name: savedForm.fullName,
              amount: Number(savedForm.amount),
              currency: config?.display_currency ?? "XOF",
              service_label: serviceLabel,
              reference: savedForm.dossierReference || null,
              payment_id: payload.payment_id ?? null,
            }),
          }).catch(() => null);
          window.localStorage.removeItem("pieagency.payment.lastForm");
        }
      }
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
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!checkoutReturn || typeof window === "undefined") {
      return;
    }

    const rawValue = window.localStorage.getItem(LAST_CHECKOUT_STORAGE_KEY);
    if (!rawValue) {
      return;
    }

    try {
      const savedCheckout = JSON.parse(rawValue) as PaymentResponse;
      setPaymentResult(savedCheckout);

      if (savedCheckout.cart_id) {
        void checkStatus(savedCheckout.cart_id);
      }
    } catch {
      window.localStorage.removeItem(LAST_CHECKOUT_STORAGE_KEY);
    }
  }, [checkoutReturn, checkStatus]);

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
          "Le paiement en ligne n'est pas encore active sur ce backend. Ajoutez la configuration MakeTou dans Render.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    setPaymentResult(null);
    setStatusResult(null);

    const normalizedPhone = normalizePhone(form.phone);

    try {
      const response = await fetch(`${apiBaseUrl}/api/payments/maketou/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          phone: normalizedPhone,
          amount: Number(form.amount),
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
        throw new Error("MakeTou n'a pas retourne de reponse exploitable.");
      }

      setPaymentResult(payload);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LAST_CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
        // Save form data so receipt endpoint has name/email/amount after redirect
        window.localStorage.setItem("pieagency.payment.lastForm", JSON.stringify(form));
      }

      setFeedback({
        type: "success",
        message: payload.message,
      });

      if (payload.redirect_url && typeof window !== "undefined") {
        window.setTimeout(() => {
          window.location.assign(payload.redirect_url!);
        }, 900);
      }
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

  const currentService = serviceOptions.find((item) => item.slug === form.serviceSlug);
  const displayCurrency = config?.display_currency ?? "XOF";
  const progressStep =
    paymentResult || statusResult || checkoutReturn
      ? 3
      : form.serviceSlug ||
          form.dossierReference.trim() ||
          form.amount.trim() ||
          form.reason.trim() !== initialState.reason
        ? 2
        : 1;
  const journeyItems = [
    {
      number: 1,
      label: "Vos informations",
    },
    {
      number: 2,
      label: "Montant & dossier",
    },
    {
      number: 3,
      label: "Paiement securise",
    },
  ];
  const trustItems = [
    "Paiement traite sur la page securisee MakeTou.",
    `Devise affichee : ${displayCurrency}.`,
    "Montant libre, mais deja valide avec PieAgency avant paiement.",
    currentService ? `Service concerne : ${currentService.label}.` : "Reference dossier facultative mais recommandee.",
  ];

  return (
    <div className="payment-shell">
      <div className="payment-page-head">
        <div>
          <div className="section-label">Paiement en ligne</div>
          <h2 className="section-title payment-page-title">Regler un montant convenu</h2>
          <p className="section-lead compact payment-page-copy">
            Remplissez le formulaire ci-dessous uniquement pour un montant deja valide
            avec un conseiller PieAgency. Vous serez ensuite redirige vers MakeTou pour
            finaliser le paiement.
          </p>
        </div>
        <div className={`payment-badge ${config?.enabled ? "is-live" : "is-disabled"}`}>
          {config?.enabled ? "Actif" : isLoadingConfig ? "Chargement" : "Indisponible"}
        </div>
      </div>

      <div className="payment-progress" aria-hidden="true">
        {journeyItems.map((item) => {
          const state =
            progressStep > item.number
              ? "is-complete"
              : progressStep === item.number
                ? "is-active"
                : "is-pending";

          return (
            <div className={`payment-progress-step ${state}`} key={item.number}>
              <span className="payment-progress-circle">{item.number}</span>
              <span className="payment-progress-label">{item.label}</span>
            </div>
          );
        })}
      </div>

      {feedback ? (
        <div className={`form-feedback ${feedback.type === "info" ? "success" : feedback.type}`}>
          {feedback.message}
        </div>
      ) : null}

      {checkoutReturn ? (
        <div className="payment-return-banner">
          Vous revenez de MakeTou. Vous pouvez verifier le statut de votre paiement ci-dessous.
        </div>
      ) : null}

      <div className="payment-main-grid">
        <form className="form-card payment-form-card" onSubmit={handleSubmit}>
          <div className="payment-form-intro">
            <div className="section-label">Formulaire de paiement</div>
            <h3>Completer le paiement</h3>
            <p>
              Saisissez vos coordonnees, le service concerne et le montant deja valide
              avec PieAgency.
            </p>
          </div>

          <div className="payment-card-section">
            <div className="payment-card-section-head">
              <div className="payment-card-kicker">Identite</div>
              <p>Les coordonnees qui seront rattachees au paiement et au dossier.</p>
            </div>

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
                  Telephone
                </label>
                <input
                  aria-invalid={Boolean(errors.phone)}
                  className="form-input"
                  id="payment-phone"
                  inputMode="tel"
                  onBlur={(event) => updateField("phone", normalizePhone(event.target.value))}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+22899159953"
                  type="tel"
                  value={form.phone}
                />
                {errors.phone ? <div className="form-error">{errors.phone}</div> : null}
                <div className="form-help">
                  Saisissez toujours le numero avec l&apos;indicatif pays, par exemple{" "}
                  <code>+22899159953</code>.
                </div>
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
                  <option value="">Acompte general</option>
                  {serviceOptions.map((service) => (
                    <option key={service.slug} value={service.slug}>
                      {service.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="payment-card-divider" />

          <div className="payment-card-section">
            <div className="payment-card-section-head">
              <div className="payment-card-kicker">Dossier et montant</div>
              <p>Les informations qui permettent de relier le paiement a votre accompagnement.</p>
            </div>

            <div className="payment-grid">
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
                  Montant convenu ({displayCurrency})
                </label>
                <input
                  aria-invalid={Boolean(errors.amount)}
                  className="form-input"
                  id="payment-amount"
                  min="1"
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="Ex: 75000"
                  step="1"
                  type="number"
                  value={form.amount}
                />
                {errors.amount ? <div className="form-error">{errors.amount}</div> : null}
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
          </div>

          <div className="payment-form-footer">
            <button className="btn btn-primary btn-lg" disabled={isSubmitting || isLoadingConfig} type="submit">
              {isSubmitting ? "Creation du panier..." : "Continuer vers le paiement"}
            </button>
            <div className="payment-footnote">
              Le paiement est finalise sur la page securisee MakeTou. Le montant saisi doit
              correspondre au montant deja confirme avec PieAgency.
            </div>
          </div>
        </form>

        <aside className="payment-sidebar">
          <div className="payment-side-card">
            <div className="payment-side-title">Comment ca marche</div>
            <div className="payment-side-list">
              <div className="payment-side-item">
                <span className="payment-side-item-index">1</span>
                <div>
                  <strong>Remplissez ce formulaire</strong>
                  <p>Vos coordonnees, le service et le montant valide avec votre conseiller.</p>
                </div>
              </div>
              <div className="payment-side-item">
                <span className="payment-side-item-index">2</span>
                <div>
                  <strong>Redirection securisee</strong>
                  <p>Vous etes redirige vers MakeTou pour choisir votre moyen de paiement.</p>
                </div>
              </div>
              <div className="payment-side-item">
                <span className="payment-side-item-index">3</span>
                <div>
                  <strong>Confirmation</strong>
                  <p>Vous revenez ici pour verifier le statut du panier et du paiement.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-side-card">
            <div className="payment-side-title">Securite</div>
            <div className="payment-check-list">
              {trustItems.map((item) => (
                <div className="payment-check-item" key={item}>
                  <span className="payment-check-mark">OK</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {paymentResult || statusResult ? (
        <div className="payment-results-stack">
          {paymentResult ? (
            <div className="payment-status-card">
              <div className="payment-status-head">
                <div>
                  <div className="payment-note-kicker">Panier cree</div>
                  <h4>Suivi MakeTou</h4>
                </div>
                <div className={`payment-status-pill is-${paymentResult.status}`}>
                  {paymentResult.status}
                </div>
              </div>
              <div className="payment-status-grid">
                <div>
                  <span>Panier</span>
                  <strong>{paymentResult.cart_id ?? "Non retourne"}</strong>
                </div>
                <div>
                  <span>Reference</span>
                  <strong>{paymentResult.reference ?? "Non retournee"}</strong>
                </div>
                <div>
                  <span>Paiement</span>
                  <strong>{paymentResult.payment_id ?? "En attente"}</strong>
                </div>
              </div>
              <div className="payment-inline-actions">
                {paymentResult.redirect_url ? (
                  <a
                    className="btn btn-primary"
                    href={paymentResult.redirect_url}
                    rel="noreferrer"
                    target="_self"
                  >
                    Ouvrir MakeTou
                  </a>
                ) : null}
                {paymentResult.status_check_enabled && paymentResult.cart_id ? (
                  <button
                    className="btn btn-outline"
                    disabled={isCheckingStatus}
                    onClick={() => checkStatus(paymentResult.cart_id!)}
                    type="button"
                  >
                    {isCheckingStatus ? "Verification..." : "Verifier le statut"}
                  </button>
                ) : null}
              </div>
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
                  <span>Panier</span>
                  <strong>{statusResult.cart_id}</strong>
                </div>
                <div>
                  <span>Reference</span>
                  <strong>{statusResult.reference ?? "Non retournee"}</strong>
                </div>
                <div>
                  <span>Paiement</span>
                  <strong>{statusResult.payment_id ?? "En attente"}</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
