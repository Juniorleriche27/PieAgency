"use client";

import Link from "next/link";
import { CreditCard, Eye, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPrivatePaymentConfig,
  fetchPrivateSubscriptions,
  type PrivatePaymentConfig,
  type PrivateSubscriptionPlan,
} from "@/lib/private-subscriptions";

function billingLabel(period: PrivateSubscriptionPlan["billing_period"]) {
  if (period === "one_time") {
    return "Unique";
  }
  if (period === "yearly") {
    return "Annuel";
  }
  return "Mensuel";
}

function formatPrice(plan: PrivateSubscriptionPlan) {
  return new Intl.NumberFormat("fr-FR", {
    currency: plan.currency,
    maximumFractionDigits: plan.price % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(plan.price);
}

export function AdminSubscriptionsView() {
  const [plans, setPlans] = useState<PrivateSubscriptionPlan[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PrivatePaymentConfig | null>(null);
  const [query, setQuery] = useState("");
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

  const filteredPlans = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return plans;
    }

    return plans.filter((plan) =>
      [
        plan.title,
        plan.description,
        plan.service_slug,
        plan.billing_period,
        plan.features.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [plans, query]);

  const recommendedCount = plans.filter((plan) => plan.recommended).length;

  return (
    <div className="admin-subscriptions-page">
      <section className="admin-subscriptions-hero">
        <div>
          <span>Gestion admin</span>
          <h1>Abonnements</h1>
          <p>
            Suivi interne des plans visibles dans l&apos;espace candidat et de la
            configuration paiement associee.
          </p>
        </div>
        <div className="admin-subscriptions-status">
          <CreditCard size={20} />
          <strong>{paymentConfig?.enabled ? "Paiement actif" : "Paiement incomplet"}</strong>
          <span>{paymentConfig?.display_currency ?? "Devise inconnue"}</span>
        </div>
      </section>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      <section className="admin-subscriptions-metrics">
        <div>
          <span>Plans</span>
          <strong>{plans.length}</strong>
        </div>
        <div>
          <span>Recommandes</span>
          <strong>{recommendedCount}</strong>
        </div>
        <div>
          <span>Provider</span>
          <strong>{paymentConfig?.provider ?? "MakeTou"}</strong>
        </div>
        <div>
          <span>Statut check</span>
          <strong>{paymentConfig?.status_check_enabled ? "Oui" : "Non"}</strong>
        </div>
      </section>

      <section className="admin-subscriptions-toolbar">
        <label>
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par plan, slug, feature..."
            type="search"
            value={query}
          />
        </label>
        <button className="btn btn-outline" disabled type="button">
          Nouveau plan
        </button>
      </section>

      <section className="admin-subscriptions-table-card">
        {isLoading ? (
          <div className="admin-subscriptions-loading">
            {Array.from({ length: 3 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        ) : null}

        {!isLoading && filteredPlans.length ? (
          <div className="admin-subscriptions-table-wrap">
            <table className="admin-subscriptions-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Prix</th>
                  <th>Cycle</th>
                  <th>Features</th>
                  <th>Slug paiement</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.title}</strong>
                      <span>{plan.description}</span>
                      {plan.recommended ? (
                        <small className="admin-subscriptions-recommended">
                          <ShieldCheck size={14} />
                          Recommande
                        </small>
                      ) : null}
                    </td>
                    <td>{formatPrice(plan)}</td>
                    <td>{billingLabel(plan.billing_period)}</td>
                    <td>
                      <span>{plan.features.length} element(s)</span>
                    </td>
                    <td>
                      <code>{plan.service_slug}</code>
                    </td>
                    <td>
                      <Link href={`/paiement?service=${encodeURIComponent(plan.service_slug)}`}>
                        <Eye size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!isLoading && !filteredPlans.length ? (
          <div className="portal-empty">
            Aucun plan ne correspond a cette recherche.
          </div>
        ) : null}
      </section>

      <section className="admin-subscriptions-note">
        <div>
          <span>Limite actuelle</span>
          <p>
            Les plans sont en lecture seule tant que le CRUD abonnement et
            l&apos;historique paiement rattache aux comptes ne sont pas ajoutes au backend.
          </p>
        </div>
        <Link className="btn btn-outline" href="/espace-etudiant/abonnement">
          Voir cote candidat
        </Link>
      </section>
    </div>
  );
}
