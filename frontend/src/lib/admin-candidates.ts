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
  progress_percent: number;
  created_at_label: string;
  source: "case" | "lead";
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
