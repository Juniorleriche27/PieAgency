import { authenticatedFetch } from "@/lib/auth";

export type PrivateDiagnosticResult = {
  currentPriority: string;
  mainRisk: string;
  nextAction: string;
  recommendedProducts: string[];
  adaptedChecklist: string[];
};

type PrivateDiagnosticApiResponse = {
  current_priority: string;
  main_risk: string;
  next_action: string;
  recommended_products: string[];
  adapted_checklist: string[];
};

export async function getPrivateDiagnostic(): Promise<PrivateDiagnosticResult> {
  const response = await authenticatedFetch(
      "/api/private/diagnostic",
      { cache: "no-store" },
      { requireAuth: true },
    );

  if (!response.ok) throw new Error("Impossible de charger le diagnostic.");

    const payload = (await response.json()) as PrivateDiagnosticApiResponse;
  return {
      currentPriority: payload.current_priority,
      mainRisk: payload.main_risk,
      nextAction: payload.next_action,
      recommendedProducts: payload.recommended_products,
      adaptedChecklist: payload.adapted_checklist,
  };
}
