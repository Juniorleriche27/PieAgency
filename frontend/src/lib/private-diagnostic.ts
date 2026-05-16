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

const MOCK_DIAGNOSTIC_RESULT: PrivateDiagnosticResult = {
  currentPriority: "Clarifier votre projet d'etudes",
  mainRisk: "Motivations trop generales",
  nextAction: "Preparer votre projet d'etudes avant les lettres de motivation",
  recommendedProducts: ["prod-003", "prod-001", "prod-006"],
  adaptedChecklist: [
    "Definir vos motivations principales",
    "Rechercher les ecoles ou formations adaptees",
    "Rediger votre projet d'etudes",
    "Preparer vos lettres de motivation",
    "Preparer votre entretien",
  ],
};

export async function getPrivateDiagnostic(): Promise<PrivateDiagnosticResult> {
  try {
    const response = await authenticatedFetch(
      "/api/private/diagnostic",
      { cache: "no-store" },
      { requireAuth: true },
    );

    if (!response.ok) {
      throw new Error("Impossible de charger le diagnostic.");
    }

    const payload = (await response.json()) as PrivateDiagnosticApiResponse;
    return {
      currentPriority: payload.current_priority,
      mainRisk: payload.main_risk,
      nextAction: payload.next_action,
      recommendedProducts: payload.recommended_products,
      adaptedChecklist: payload.adapted_checklist,
    };
  } catch {
    return MOCK_DIAGNOSTIC_RESULT;
  }
}
