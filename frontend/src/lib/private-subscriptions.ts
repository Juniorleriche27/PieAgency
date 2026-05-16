import { authenticatedFetch } from "@/lib/auth";

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
};

export type PrivatePaymentConfig = {
  enabled: boolean;
  provider: "maketou";
  merchant_label: string;
  display_currency: string;
  instructions: string;
  status_check_enabled: boolean;
};

type PrivateSubscriptionListResponse = {
  plans: PrivateSubscriptionPlan[];
};

export async function fetchPrivateSubscriptions(): Promise<PrivateSubscriptionPlan[]> {
  const response = await authenticatedFetch(
    "/api/private/subscriptions",
    { cache: "no-store" },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les abonnements.");
  }

  const payload = (await response.json()) as PrivateSubscriptionListResponse;
  return payload.plans;
}

export async function fetchPrivatePaymentConfig(): Promise<PrivatePaymentConfig> {
  const response = await authenticatedFetch("/api/payments/config", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Impossible de charger la configuration de paiement.");
  }

  return (await response.json()) as PrivatePaymentConfig;
}
