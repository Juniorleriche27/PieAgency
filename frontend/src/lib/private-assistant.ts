import { authenticatedFetch } from "@/lib/auth";

export type PrivateAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PrivateAssistantResponse = {
  answer: string;
  conversation_id?: string | null;
  suggested_actions: string[];
  escalation_recommended: boolean;
  source: "cohere" | "fallback";
};

export async function sendPrivateAssistantMessage(payload: {
  conversationId?: string | null;
  messages: PrivateAssistantMessage[];
}): Promise<PrivateAssistantResponse> {
  const response = await authenticatedFetch(
    "/api/ai/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_path: "/espace-etudiant/assistant",
        conversation_id: payload.conversationId ?? null,
        messages: payload.messages.slice(-10),
      }),
    },
    { requireAuth: true },
  );

  if (!response.ok) {
    throw new Error("Impossible de contacter l'assistant pour le moment.");
  }

  return (await response.json()) as PrivateAssistantResponse;
}
