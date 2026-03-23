"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ensureActiveSession, getApiBaseUrl } from "@/lib/auth";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatResponse = {
  conversation_id?: string | null;
  suggested_actions: string[];
  escalation_recommended: boolean;
  source: "cohere" | "fallback";
};

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Bonjour, je suis l'assistant PieAgency. Je peux vous aider sur Campus France, visa, Belgique, Parcoursup, Paris-Saclay, ecoles privees, ou vous orienter vers le bon contact.",
  },
];

export function SiteChatbot() {
  const pathname = usePathname();
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    "Quel service choisir ?",
    "Comment demarrer ?",
    "Parler a un conseiller",
  ]);
  const [isSending, setIsSending] = useState(false);
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const isBusy = isSending;

  useEffect(() => {
    function handleOpen() {
      setIsOpen(true);
    }

    window.addEventListener("pieagency-chat-open", handleOpen);
    return () => window.removeEventListener("pieagency-chat-open", handleOpen);
  }, []);

  useEffect(() => {
    const node = bodyRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isOpen]);

  function appendAssistantChunk(text: string) {
    setHasStartedStreaming(true);
    setMessages((current) => {
      const updated = [...current];
      const lastMessage = updated.at(-1);

      if (!lastMessage || lastMessage.role !== "assistant") {
        updated.push({ role: "assistant", content: text });
        return updated;
      }

      updated[updated.length - 1] = {
        role: "assistant",
        content: `${lastMessage.content}${text}`,
      };
      return updated;
    });
  }

  function setAssistantMessage(text: string) {
    setMessages((current) => {
      const updated = [...current];
      const lastMessage = updated.at(-1);

      if (!lastMessage || lastMessage.role !== "assistant") {
        updated.push({ role: "assistant", content: text });
        return updated;
      }

      updated[updated.length - 1] = {
        role: "assistant",
        content: text,
      };
      return updated;
    });
  }

  function handleStreamEvent(rawEvent: string) {
    const lines = rawEvent.split(/\r?\n/);
    let eventName = "message";
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trimStart();
      }
    }

    if (!data) {
      return;
    }

    const payload = JSON.parse(data) as ChatResponse & { text?: string };

    if (payload.conversation_id) {
      setConversationId(payload.conversation_id);
    }

    if (eventName === "chunk" && payload.text) {
      appendAssistantChunk(payload.text);
      return;
    }

    if (eventName === "done") {
      setSuggestedActions(payload.suggested_actions);
    }
  }

  async function sendMessage(rawContent: string) {
    const content = rawContent.trim();
    if (!content || isBusy) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setHasStartedStreaming(false);

    try {
      const session = await ensureActiveSession(apiBaseUrl);
      const headers = new Headers({
        "Content-Type": "application/json",
      });
      if (session) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
      }

      const response = await fetch(`${apiBaseUrl}/api/ai/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          page_path: pathname,
          conversation_id: conversationId,
          messages: nextMessages,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to fetch chat response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";

        for (const event of events) {
          handleStreamEvent(event);
        }
      }

      if (buffer.trim()) {
        handleStreamEvent(buffer);
      }
    } catch {
      setAssistantMessage(
        "Je ne peux pas repondre proprement pour le moment. Vous pouvez passer par le formulaire ou WhatsApp pour parler a un conseiller PieAgency.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={`chatbot-shell ${isOpen ? "open" : ""}`}>
      {isOpen ? (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-kicker">Assistant IA</div>
              <div className="chatbot-title">Assistant PieAgency</div>
            </div>
            <button
              aria-label="Fermer le chatbot"
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              X
            </button>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((message, index) => (
              <div
                className={`chatbot-message ${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </div>
            ))}
            {isSending && !hasStartedStreaming ? (
              <div className="chatbot-message assistant">
                L&apos;assistant reflechit...
              </div>
            ) : null}
          </div>

          <div className="chatbot-suggestions">
            {suggestedActions.map((action) => (
              <button
                className="chatbot-chip"
                disabled={isBusy}
                key={action}
                onClick={() => sendMessage(action)}
                type="button"
              >
                {action}
              </button>
            ))}
          </div>

          <form
            className="chatbot-form"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <textarea
              className="chatbot-input"
              disabled={isBusy}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Posez votre question sur PieAgency..."
              rows={3}
              value={input}
            />
            <button className="btn btn-primary" disabled={isBusy} type="submit">
              Envoyer
            </button>
          </form>
        </div>
      ) : null}

      <button
        className="chatbot-launcher"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="chatbot-launcher-dot">N</span>
        <span>Assistant IA</span>
      </button>
    </div>
  );
}
