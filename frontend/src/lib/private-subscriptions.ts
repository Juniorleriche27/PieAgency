import { authenticatedFetch } from "@/lib/auth";
import { euroToXof } from "@/lib/currency";

export type PrivateSubscriptionPlan = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  billing_period: "one_time" | "monthly" | "yearly";
  features: string[];
  recommended: boolean;
  service_slug: string;
  is_active: boolean;
  sort_order: number;
};

export type PrivatePaymentConfig = {
  enabled: boolean;
  provider: "maketou";
  merchant_label: string;
  display_currency: string;
  instructions: string;
  status_check_enabled: boolean;
};

export type UserSubscription = {
  current_plan_id: string | null;
  plan: PrivateSubscriptionPlan | null;
};

export const SUBSCRIPTION_PAYMENT_OPTIONS = [
  {
    slug: "essentiel-mensuel",
    label: "Abonnement Essentiel",
    priceEuro: 9.99,
    priceCfa: euroToXof(9.99),
  },
  {
    slug: "standard-mensuel",
    label: "Abonnement Standard",
    priceEuro: 19.99,
    priceCfa: euroToXof(19.99),
  },
  {
    slug: "premium-digital-mensuel",
    label: "Abonnement Premium digital",
    priceEuro: 34.99,
    priceCfa: euroToXof(34.99),
  },
] as const;

type PrivateSubscriptionListResponse = {
  plans: PrivateSubscriptionPlan[];
};

export async function fetchPrivateSubscriptions(): Promise<PrivateSubscriptionPlan[]> {
  const response = await authenticatedFetch(
    "/api/private/subscriptions",
    { cache: "no-store" },
    { requireAuth: true },
  );
  if (!response.ok) throw new Error("Impossible de charger les abonnements.");
  const payload = (await response.json()) as PrivateSubscriptionListResponse;
  return payload.plans;
}

export async function fetchPrivatePaymentConfig(): Promise<PrivatePaymentConfig> {
  const response = await authenticatedFetch("/api/payments/config", { cache: "no-store" });
  if (!response.ok) throw new Error("Impossible de charger la configuration de paiement.");
  return (await response.json()) as PrivatePaymentConfig;
}

export async function fetchCurrentSubscription(): Promise<UserSubscription> {
  const response = await authenticatedFetch(
      "/api/private/subscription/current",
      { cache: "no-store" },
      { requireAuth: true },
    );
  if (!response.ok) throw new Error("Impossible de charger votre abonnement actuel.");
  return (await response.json()) as UserSubscription;
}

export async function selectFreeSubscription(planId: string): Promise<UserSubscription> {
  const response = await authenticatedFetch("/api/private/subscription/current", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan_id: planId }) }, { requireAuth: true });
  if (!response.ok) throw new Error("Impossible d'activer ce plan.");
  return (await response.json()) as UserSubscription;
}

export async function adminCreatePlan(
  data: Omit<PrivateSubscriptionPlan, "id" | "is_active" | "sort_order">,
): Promise<PrivateSubscriptionPlan | null> {
  try {
    const res = await authenticatedFetch(
      "/api/admin/subscription-plans",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
      { requireAuth: true },
    );
    if (!res.ok) throw new Error();
    return (await res.json()) as PrivateSubscriptionPlan;
  } catch {
    return null;
  }
}

export async function adminUpdatePlan(
  planId: string,
  data: Partial<PrivateSubscriptionPlan>,
): Promise<PrivateSubscriptionPlan | null> {
  try {
    const res = await authenticatedFetch(
      `/api/admin/subscription-plans/${planId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
      { requireAuth: true },
    );
    if (!res.ok) throw new Error();
    return (await res.json()) as PrivateSubscriptionPlan;
  } catch {
    return null;
  }
}

export async function adminDeletePlan(planId: string): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `/api/admin/subscription-plans/${planId}`,
      { method: "DELETE" },
      { requireAuth: true },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminSetCandidatePlan(userId: string, planId: string): Promise<boolean> {
  try {
    const res = await authenticatedFetch(
      `/api/admin/candidates/${userId}/subscription`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      },
      { requireAuth: true },
    );
    return res.ok;
  } catch {
    return false;
  }
}
