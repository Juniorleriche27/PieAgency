"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
      "Bonjour, je suis la messagerie PieAgency. Je peux vous aider sur Campus France, visa, Belgique, Parcoursup, Paris-Saclay, ecoles privees, ou vous orienter vers le bon contact.",
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!isOpen) {
      root.classList.remove("chat-open");
      body.classList.remove("chat-open");
      return;
    }

    root.classList.add("chat-open");
    body.classList.add("chat-open");

    if (!window.matchMedia("(max-width: 640px)").matches) {
      return () => {
        root.classList.remove("chat-open");
        body.classList.remove("chat-open");
      };
    }

    const lockedScrollY = window.scrollY;
    body.dataset.chatScrollY = String(lockedScrollY);
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      const nextScrollY = Number(body.dataset.chatScrollY || lockedScrollY);
      root.classList.remove("chat-open");
      body.classList.remove("chat-open");
      delete body.dataset.chatScrollY;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.scrollTo(0, nextScrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      document.documentElement.style.removeProperty("--chatbot-mobile-height");
      return;
    }

    const root = document.documentElement;
    const viewport = window.visualViewport;
    const syncViewportHeight = () => {
      const nextHeight = Math.round(viewport?.height ?? window.innerHeight);
      root.style.setProperty("--chatbot-mobile-height", `${nextHeight}px`);
    };

    syncViewportHeight();
    viewport?.addEventListener("resize", syncViewportHeight);
    viewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);

    return () => {
      viewport?.removeEventListener("resize", syncViewportHeight);
      viewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
      root.style.removeProperty("--chatbot-mobile-height");
    };
  }, [isOpen]);

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

  function cleanAssistantText(text: string) {
    return text
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`/g, "")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 $2")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function renderMessageContent(text: string) {
    const normalized = cleanAssistantText(text);
    const tokenPattern = /(https?:\/\/[^\s]+)|(\n)/g;
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let matchIndex = 0;

    for (const match of normalized.matchAll(tokenPattern)) {
      const [fullMatch, url, lineBreak] = match;
      const start = match.index ?? 0;

      if (start > lastIndex) {
        nodes.push(normalized.slice(lastIndex, start));
      }

      if (lineBreak) {
        nodes.push(<br key={`br-${matchIndex}`} />);
      } else if (url) {
        const label = url.replace(/^https?:\/\//, "") || "Ouvrir le lien";
        nodes.push(
          <a
            className="chatbot-inline-link"
            href={url}
            key={`url-${matchIndex}`}
            rel="noreferrer"
            target="_blank"
          >
            {label}
          </a>,
        );
      }

      lastIndex = start + fullMatch.length;
      matchIndex += 1;
    }

    if (lastIndex < normalized.length) {
      nodes.push(normalized.slice(lastIndex));
    }

    return nodes;
  }

  function resolveSuggestedAction(action: string) {
    const normalized = action.trim().toLowerCase();

    if (
      normalized.includes("formulaire") ||
      normalized.includes("dossier") ||
      normalized.includes("envoyer ma demande")
    ) {
      return {
        kind: "link" as const,
        label: "Commencer mon dossier",
        href: "/contact",
        external: false,
        tone: "primary",
      };
    }

    if (normalized.includes("whatsapp")) {
      return {
        kind: "link" as const,
        label: "Remplir le formulaire",
        href: "/contact",
        external: false,
        tone: "primary",
      };
    }

    if (normalized.includes("conseiller")) {
      return {
        kind: "link" as const,
        label: "Parler a un conseiller",
        href: "/contact",
        external: false,
        tone: "primary",
      };
    }

    return {
      kind: "prompt" as const,
      label: action,
      prompt: action,
      tone: "secondary",
    };
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
        "Je ne peux pas repondre proprement pour le moment. Vous pouvez passer par le formulaire ou le chat du site pour parler a un conseiller PieAgency.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={`chatbot-shell ${isOpen ? "open" : ""}`}>
      {isOpen ? (
        <>
          <button
            aria-label="Fermer la messagerie"
            className="chatbot-backdrop"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <div className="chatbot-panel">
            <div className="chatbot-header">
              <div>
                <div className="chatbot-kicker">Messagerie</div>
                <div className="chatbot-title">Conseiller PieAgency</div>
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
                  {renderMessageContent(message.content)}
                </div>
              ))}
              {isSending && !hasStartedStreaming ? (
                <div className="chatbot-message assistant">
                  L&apos;assistant reflechit...
                </div>
              ) : null}
            </div>

            <div className="chatbot-suggestions">
              {Array.from(
                new Map(
                  suggestedActions.map((a) => {
                    const r = resolveSuggestedAction(a);
                    return [r.label, { action: a, resolved: r }];
                  })
                ).values()
              ).map(({ resolved }) => {
                const resolved2 = resolved;

                if (resolved2.kind === "link") {
                  if (resolved2.external) {
                    return (
                      <a
                        className={`chatbot-action chatbot-action-${resolved2.tone}`}
                        href={resolved2.href}
                        key={resolved2.label}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {resolved2.label}
                      </a>
                    );
                  }

                  return (
                    <Link
                      className={`chatbot-action chatbot-action-${resolved2.tone}`}
                      href={resolved2.href}
                      key={resolved2.label}
                    >
                      {resolved2.label}
                    </Link>
                  );
                }

                return (
                  <button
                    className={`chatbot-action chatbot-action-${resolved2.tone}`}
                    disabled={isBusy}
                    key={resolved2.label}
                    onClick={() => sendMessage(resolved2.prompt)}
                    type="button"
                  >
                    {resolved2.label}
                  </button>
                );
              })}
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
                onFocus={() => {
                  window.requestAnimationFrame(() => {
                    bodyRef.current?.scrollTo({
                      top: bodyRef.current.scrollHeight,
                      behavior: "smooth",
                    });
                  });
                }}
                placeholder="Posez votre question sur PieAgency..."
                ref={inputRef}
                rows={3}
                value={input}
              />
              <button className="btn btn-primary" disabled={isBusy} type="submit">
                Envoyer
              </button>
            </form>
          </div>
        </>
      ) : null}

      {!isOpen ? (
        <button
          aria-label="Ouvrir la messagerie"
          className="chatbot-launcher"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span aria-hidden="true" className="chatbot-launcher-dot" />
        </button>
      ) : null}
    </div>
  );
}
