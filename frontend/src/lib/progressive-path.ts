import { authenticatedFetch } from "@/lib/auth";

export type StepStatus = "not_started" | "in_progress" | "needs_review" | "completed" | "blocked";
export type PlatformType = "campus_france" | "private_school" | "parcoursup" | "belgium" | "visa" | "other";
export type OfficialDepositStatus = "declared" | "under_review" | "accepted" | "refused" | "waiting" | "other";

export type ProgressiveStep = {
  id: string;
  title: string;
  order: number;
  status: StepStatus;
  short_description: string;
  is_current: boolean;
  is_locked: boolean;
  target_module: string;
  target_path: string;
};

export type RecommendationAction = {
  title: string;
  description: string;
  target_module: string;
  target_path: string;
};

export type RecommendedProduct = RecommendationAction & {
  requires_purchase: boolean;
};

export type Recommendations = {
  current_step_id: string;
  free_action: RecommendationAction | null;
  recommended_product: RecommendedProduct | null;
  assistant_action: RecommendationAction | null;
  document_action: RecommendationAction | null;
};

export type OfficialDeposit = {
  has_declared: boolean;
  platform_type: PlatformType | null;
  platform_name: string | null;
  official_deposit_date: string | null;
  official_reference: string | null;
  status: OfficialDepositStatus | null;
  comment: string | null;
};

export type ProgressivePath = {
  candidate_id: string;
  current_step: ProgressiveStep | null;
  progress_percent: number;
  steps: ProgressiveStep[];
  official_deposit: OfficialDeposit;
  recommendations: Recommendations;
};

export type OfficialDepositBody = {
  platform_type: PlatformType;
  platform_name: string;
  official_deposit_date: string;
  official_reference: string;
  status: OfficialDepositStatus;
  comment: string;
};

async function mutate(path: string): Promise<ProgressivePath | null> {
  try {
    const res = await authenticatedFetch(path, { method: "POST" }, { requireAuth: true });
    if (!res.ok) throw new Error();
    return (await res.json()) as ProgressivePath;
  } catch {
    return null;
  }
}

export async function fetchProgressivePath(): Promise<ProgressivePath> {
  const res = await authenticatedFetch(
    "/api/candidate/progressive-path",
    { cache: "no-store" },
    { requireAuth: true },
  );
  if (!res.ok) throw new Error("Impossible de charger le parcours.");
  return (await res.json()) as ProgressivePath;
}

export async function startStep(stepId: string): Promise<ProgressivePath | null> {
  return mutate(`/api/candidate/progressive-path/steps/${stepId}/start`);
}

export async function completeStep(stepId: string): Promise<ProgressivePath | null> {
  return mutate(`/api/candidate/progressive-path/steps/${stepId}/complete`);
}

export async function reopenStep(stepId: string): Promise<ProgressivePath | null> {
  return mutate(`/api/candidate/progressive-path/steps/${stepId}/reopen`);
}

// ─── Guidance intelligente ────────────────────────────────────────────────────

export type GuidanceOption = {
  title: string;
  description: string;
  target_path: string;
};

export type AssistantSuggestion = {
  message?: string;
  target_path: string;
};

export type Guidance = {
  current_step_id: string;
  phase: string;
  title: string;
  objective: string;
  what_to_do_now: string[];
  free_option: GuidanceOption | null;
  paid_option: GuidanceOption | null;
  assistant_suggestion: AssistantSuggestion | null;
  official_warning: string | null;
};

export async function fetchGuidance(): Promise<Guidance | null> {
  try {
    const res = await authenticatedFetch(
      "/api/candidate/progressive-path/guidance",
      { cache: "no-store" },
      { requireAuth: true },
    );
    if (!res.ok) return null;
    return (await res.json()) as Guidance;
  } catch {
    return null;
  }
}

export async function declareOfficialDeposit(body: OfficialDepositBody): Promise<ProgressivePath | null> {
  try {
    const res = await authenticatedFetch(
      "/api/candidate/progressive-path/official-deposit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      { requireAuth: true },
    );
    if (!res.ok) throw new Error();
    return (await res.json()) as ProgressivePath;
  } catch {
    return null;
  }
}
