import { authenticatedFetch } from "@/lib/auth";

export type PrivateAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

/* ── Legacy response (kept for backward compat) ── */
export type PrivateAssistantResponse = {
  answer: string;
  conversation_id?: string | null;
  suggested_actions: string[];
  escalation_recommended: boolean;
  source: "cohere" | "fallback";
};

/* ── New candidate assistant response ── */
export type CandidateAssistantResource = {
  id?: string;
  title: string;
  type?: string;
  access?: "free" | "included" | "premium_locked";
  target_path?: string;
  summary?: string;
};

export type CandidateAssistantResponse = {
  answer: string;
  used_prompt?: string;
  used_context?: {
    candidate_profile?: boolean;
    progressive_path?: boolean;
    recommendations?: boolean;
    resources?: boolean;
  };
  rag?: {
    used: boolean;
    resources_count?: number;
    resources?: CandidateAssistantResource[];
  };
};

export async function sendCandidateAssistantMessage(payload: {
  message: string;
  context_source?: string;
  current_step_id?: string | null;
}): Promise<CandidateAssistantResponse> {
  const body: Record<string, unknown> = {
    message: payload.message,
    context_source: payload.context_source ?? "progressive_path",
  };
  if (payload.current_step_id) {
    body.current_step_id = payload.current_step_id;
  }

  const response = await authenticatedFetch(
    "/api/candidate/assistant/chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de contacter l'assistant pour le moment.");
  }

  return (await response.json()) as CandidateAssistantResponse;
}
