export type AssistantGenieOpenDetail = {
  message?: string;
  documentId?: string | null;
  requestedAction?: string;
  autoSend?: boolean;
};

export const ASSISTANT_GENIE_OPEN_EVENT = "pieagency:assistant-genie:open";

export function openAssistantGenie(detail: AssistantGenieOpenDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AssistantGenieOpenDetail>(ASSISTANT_GENIE_OPEN_EVENT, {
      detail,
    }),
  );
}
