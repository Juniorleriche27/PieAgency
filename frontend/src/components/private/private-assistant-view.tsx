"use client";

import Link from "next/link";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  sendPrivateAssistantMessage,
  type PrivateAssistantMessage,
} from "@/lib/private-assistant";

const initialMessages: PrivateAssistantMessage[] = [
  {
    role: "assistant",
    content:
      "Bonjour. Je peux vous aider a comprendre vos prochaines etapes, preparer vos documents, clarifier Campus France, le visa, la Belgique ou votre suivi PieAgency.",
  },
];

const defaultSuggestions = [
  "Quelles sont mes prochaines etapes ?",
  "Comment preparer mes documents ?",
  "J'ai une question sur le visa",
];

function cleanText(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();
}

export function PrivateAssistantView() {
  const [messages, setMessages] = useState<PrivateAssistantMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isSending]);

  async function submitMessage(rawMessage: string) {
    const content = rawMessage.trim();
    if (!content || isSending) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await sendPrivateAssistantMessage({
        conversationId,
        messages: nextMessages,
      });

      setConversationId(response.conversation_id ?? conversationId);
      setSuggestions(response.suggested_actions.length ? response.suggested_actions : defaultSuggestions);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: cleanText(response.answer),
        },
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de contacter l'assistant pour le moment.",
      );
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Je ne peux pas repondre correctement maintenant. Vous pouvez continuer votre preparation et contacter PieAgency si la question est urgente.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  return (
    <div className="private-assistant-page">
      <section className="private-assistant-hero">
        <div>
          <span>Assistant prive</span>
          <h1>Poser une question sur votre parcours PieAgency</h1>
          <p>
            Utilisez cet espace pour clarifier une etape, preparer un document ou
            mieux comprendre une procedure avant de contacter un conseiller.
          </p>
        </div>
        <div className="private-assistant-source">
          <Sparkles size={20} />
          <strong>IA PieAgency</strong>
          <span>avec historique de session</span>
        </div>
      </section>

      <div className="private-assistant-layout">
        <section className="private-assistant-panel">
          <div className="private-assistant-messages" ref={scrollRef}>
            {messages.map((message, index) => {
              const Icon = message.role === "assistant" ? Bot : UserRound;

              return (
                <div
                  className={`private-assistant-message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="private-assistant-avatar">
                    <Icon size={17} />
                  </span>
                  <p>{message.content}</p>
                </div>
              );
            })}

            {isSending ? (
              <div className="private-assistant-message assistant">
                <span className="private-assistant-avatar">
                  <Bot size={17} />
                </span>
                <p>L&apos;assistant prepare une reponse...</p>
              </div>
            ) : null}
          </div>

          {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

          <div className="private-assistant-suggestions">
            {suggestions.map((suggestion) => (
              <button
                disabled={isSending}
                key={suggestion}
                onClick={() => void submitMessage(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className="private-assistant-form" onSubmit={handleSubmit}>
            <textarea
              disabled={isSending}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ex: Qu'est-ce que je dois preparer avant mon entretien Campus France ?"
              rows={3}
              value={input}
            />
            <button className="btn btn-primary" disabled={isSending || !input.trim()} type="submit">
              <Send size={17} />
              Envoyer
            </button>
          </form>
        </section>

        <aside className="private-assistant-side">
          <div className="private-assistant-side-card">
            <span>Questions utiles</span>
            <ul>
              <li>Verifier les documents a prioriser.</li>
              <li>Comprendre une etape Campus France ou visa.</li>
              <li>Preparer les questions pour un conseiller.</li>
              <li>Clarifier un paiement ou une ressource.</li>
            </ul>
          </div>

          <div className="private-assistant-side-card">
            <span>Besoin humain</span>
            <p>
              Pour une decision sensible ou une verification de dossier, passez par
              un conseiller PieAgency.
            </p>
            <Link className="btn btn-outline" href="/contact">
              Contacter PieAgency
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
