"use client";

import Link from "next/link";
import { CheckCircle2, Minus, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchCurrentSubscription,
  fetchPrivateSubscriptions,
  type PrivateSubscriptionPlan,
  type UserSubscription,
} from "@/lib/private-subscriptions";

const COMPARISON_FEATURES = [
  "Checklist de base",
  "Guides pratiques",
  "Générateurs projet",
  "Simulateur entretien",
  "Corrections limitées",
  "Recommandations personnalisées",
];

const FAQ_ITEMS = [
  {
    q: "Puis-je changer d'abonnement ?",
    a: "Oui, vous pouvez changer d'abonnement à tout moment. Les changements prennent effet immédiatement.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, vous pouvez annuler votre abonnement à tout moment sans frais supplémentaires.",
  },
  {
    q: "Que se passe-t-il après l'essai gratuit ?",
    a: "Vous pouvez continuer avec le plan gratuit ou passer à un abonnement payant pour accéder à plus de fonctionnalités.",
  },
  {
    q: "Avez-vous des offres pour les groupes ?",
    a: "Oui, nous proposons des tarifs spéciaux pour les groupes. Contactez notre équipe pour plus d'informations.",
  },
];

function billingLabel(period: PrivateSubscriptionPlan["billing_period"]) {
  if (period === "one_time") return "paiement unique";
  if (period === "yearly") return "par an";
  return "par mois";
}

function formatPrice(plan: PrivateSubscriptionPlan) {
  if (plan.price === 0) return "0";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: plan.price % 1 === 0 ? 0 : 2,
    minimumFractionDigits: plan.price % 1 === 0 ? 0 : 2,
  }).format(plan.price);
}

function featureIncluded(plan: PrivateSubscriptionPlan, feature: string): boolean {
  const key = feature.toLowerCase().split(" ")[0];
  return plan.features.some((f) => f.toLowerCase().includes(key));
}

export function PrivateSubscriptionView() {
  const [plans, setPlans] = useState<PrivateSubscriptionPlan[]>([]);
  const [userSub, setUserSub] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [nextPlans, nextSub] = await Promise.all([
          fetchPrivateSubscriptions(),
          fetchCurrentSubscription(),
        ]);
        if (!active) return;
        setPlans(nextPlans);
        setUserSub(nextSub);
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Impossible de charger les abonnements.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const currentPlanId = userSub?.current_plan_id ?? null;
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sort_order - b.sort_order),
    [plans],
  );

  return (
    <div className="sub-page">
      <div className="sub-page-head">
        <h1>Choisissez votre abonnement</h1>
        <p>Accédez aux outils et ressources adaptés à votre parcours d&apos;études.</p>
      </div>

      {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

      {isLoading ? (
        <div className="sub-cards-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="sub-card sub-card-loading" key={i} />
          ))}
        </div>
      ) : null}

      {!isLoading && sortedPlans.length ? (
        <>
          <div className="sub-cards-grid">
            {sortedPlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isRecommended = plan.recommended;
              return (
                <article
                  className={`sub-card${isRecommended ? " sub-card-recommended" : ""}${isCurrent ? " sub-card-current" : ""}`}
                  key={plan.id}
                >
                  {isRecommended ? (
                    <div className="sub-card-badge">
                      <Star size={13} fill="currentColor" /> Recommandé
                    </div>
                  ) : isCurrent ? (
                    <div className="sub-card-badge sub-card-badge-current">Plan actuel</div>
                  ) : null}

                  <h2 className="sub-card-title">{plan.title}</h2>
                  <p className="sub-card-desc">{plan.description}</p>

                  <div className="sub-card-price">
                    <span className="sub-price-amount">{formatPrice(plan)}</span>
                    <span className="sub-price-currency">€</span>
                    {plan.price > 0 && (
                      <span className="sub-price-period">{billingLabel(plan.billing_period)}</span>
                    )}
                  </div>

                  <ul className="sub-card-features">
                    {plan.features.map((f) => (
                      <li key={f}>
                        <CheckCircle2 size={15} className="sub-check" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="sub-card-actions">
                    {isCurrent ? (
                      <span className="btn sub-btn-active">Plan actuel</span>
                    ) : (
                      <Link
                        className={`btn${isRecommended ? " sub-btn-recommended" : " btn-primary"}`}
                        href={`/paiement?service=${encodeURIComponent(plan.service_slug)}`}
                      >
                        Choisir cette offre →
                      </Link>
                    )}
                    <Link className="btn btn-ghost sub-btn-details" href="/contact">
                      Voir les détails
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="sub-comparison">
            <h2>Comparaison détaillée</h2>
            <div className="sub-comparison-wrap">
              <table className="sub-comparison-table">
                <thead>
                  <tr>
                    <th>Fonctionnalités</th>
                    {sortedPlans.map((p) => <th key={p.id}>{p.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((feature) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      {sortedPlans.map((p) => (
                        <td key={p.id} className="sub-comparison-cell">
                          {featureIncluded(p, feature) ? (
                            <CheckCircle2 size={16} className="sub-check" />
                          ) : (
                            <Minus size={16} className="sub-minus" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sub-faq">
            <h2>Questions fréquentes</h2>
            <div className="sub-faq-grid">
              {FAQ_ITEMS.map((item) => (
                <div className="sub-faq-card" key={item.q}>
                  <p className="sub-faq-q">{item.q}</p>
                  <p className="sub-faq-a">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!isLoading && !sortedPlans.length ? (
        <div className="portal-empty">Aucun plan disponible pour le moment.</div>
      ) : null}
    </div>
  );
}
