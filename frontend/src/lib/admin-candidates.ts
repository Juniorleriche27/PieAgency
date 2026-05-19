import { authenticatedFetch } from "@/lib/auth";

export type AdminCandidate = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  country: string;
  procedure: string;
  stage: string;
  subscription: string;
  status: string;
  onboarding_status?: "not_started" | "in_progress" | "submitted" | "under_review" | "validated" | "rejected" | null;
  progress_percent: number;
  created_at_label: string;
  source: "case" | "lead" | "profile";
};

type AdminCandidatesResponse = {
  candidates: AdminCandidate[];
};

export async function fetchAdminCandidates(): Promise<AdminCandidate[]> {
  const response = await authenticatedFetch(
    "/api/admin/candidates",
    { cache: "no-store" },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les candidats.");
  }

  const payload = (await response.json()) as AdminCandidatesResponse;
  return payload.candidates;
}

export async function updateCandidateOnboardingStatus(
  userId: string,
  onboardingStatus: NonNullable<AdminCandidate["onboarding_status"]>,
): Promise<AdminCandidate["onboarding_status"]> {
  const response = await authenticatedFetch(
    `/api/admin/candidates/${userId}/onboarding/status`,
    {
      body: JSON.stringify({ onboarding_status: onboardingStatus }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de mettre a jour le statut d'embarquement.");
  }

  const payload = (await response.json()) as { onboarding_status: AdminCandidate["onboarding_status"] };
  return payload.onboarding_status;
}
