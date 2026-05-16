"use client";

import Link from "next/link";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPrivatePaymentConfig,
  fetchPrivateSubscriptions,
  type PrivatePaymentConfig,
  type PrivateSubscriptionPlan,
} from "@/lib/private-subscriptions";

function billingLabel(period: PrivateSubscriptionPlan["billing_period"]) {
  if (period === "one_time") {
    return "paiement unique";
  }
  if (period === "yearly") {
    return "par an";
  }
  return "par mois";
}

function formatPrice(plan: PrivateSubscriptionPlan) {
  return new Intl.NumberFormat("fr-FR", {
    currency: plan.currency,
    maximumFractionDigits: plan.price % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(plan.price);
}

export function PrivateSubscriptionView() {
  const [plans, setPlans] = useState<PrivateSubscriptionPlan[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PrivatePaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSubscriptions() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [nextPlans, nextConfig] = await Promise.all([
          fetchPrivateSubscriptions(),
          fetchPrivatePaymentConfig(),
        ]);

        if (!active) {
          return;
        }

        setPlans(nextPlans);
        setPaymentConfig(nextConfig);
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les abonnements.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSubscriptions();
    return () => {
      active = false;
    };
  }, []);

  const recommendedPlan = useMemo(
    () => plans.find((plan) => plan.recommended) ?? plans[0],
    [plans],
  );

  return (
    <div className="private-subscription-page">
      <section className="private-subscription-hero">
        <div>
          <span>Abonnement prive</span>
          <h1>Choisir le niveau de suivi adapte a votre dossier</h1>
          <p>
            Les plans regroupent les acces ressources, le suivi de progression et les
            options d&apos;accompagnement activees par PieAgency.
          </p>
        </div>
        <div className="private-subscription-status">
          <CreditCard size={20} />
          <strong>{paymentConfig?.enabled ? "Paiement actif" : "Paiement a valider"}</strong>
          <span>{paymentConfig?.merchant_label ?? "MakeTou"}</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="private-subscription-grid">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="private-subscription-card loading" key={index}>
              <span />
              <strong />
              <p />
              <div />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && plans.length ? (
        <div className="private-subscription-grid">
          {plans.map((plan) => (
            <article
              className={`private-subscription-card ${plan.recommended ? "recommended" : ""}`}
              key={plan.id}
            >
              <div className="private-subscription-card-head">
                <div>
                  {plan.recommended ? <span>Recommande</span> : <span>Plan</span>}
                  <h2>{plan.title}</h2>
                </div>
                <ShieldCheck size={22} />
              </div>

              <p>{plan.description}</p>

              <div className="private-subscription-price">
                <strong>{formatPrice(plan)}</strong>
                <span>{billingLabel(plan.billing_period)}</span>
              </div>

              <ul className="private-subscription-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={17} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="private-subscription-actions">
                <Link
                  className="btn btn-primary"
                  href={`/paiement?service=${encodeURIComponent(plan.service_slug)}`}
                >
                  Regler ce plan
                </Link>
                <Link className="btn btn-outline" href="/contact">
                  Verifier avec un conseiller
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!isLoading && !plans.length ? (
        <div className="portal-empty">
          Aucun plan d&apos;abonnement n&apos;est disponible pour le moment.
        </div>
      ) : null}

      {recommendedPlan ? (
        <section className="private-subscription-note">
          <div>
            <span>Plan suggere</span>
            <h2>{recommendedPlan.title}</h2>
            <p>
              Avant paiement, verifiez le montant et le service avec PieAgency. La page
              paiement actuelle accepte les montants convenus et finalise ensuite sur
              MakeTou.
            </p>
          </div>
          <Link className="btn btn-green" href="/paiement">
            Ouvrir le paiement
          </Link>
        </section>
      ) : null}
    </div>
  );
}
