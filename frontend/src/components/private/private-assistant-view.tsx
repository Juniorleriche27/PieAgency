"use client";

import { Info, MessageCircle, Send } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  sendPrivateAssistantMessage,
  type PrivateAssistantMessage,
} from "@/lib/private-assistant";

const initialMessages: PrivateAssistantMessage[] = [
  {
    role: "assistant",
    content:
      "Bonjour ! Je suis votre assistant dossier. Posez-moi vos questions sur votre procedure, vos motivations, votre entretien ou vos documents. Je suis la pour vous aider a structurer vos idees.",
  },
];

const faqItems = [
  "Comment expliquer mon projet d'etudes ?",
  "Comment justifier mon choix de formation ?",
  "Comment preparer mon entretien Campus France ?",
  "Que verifier avant de deposer mon visa ?",
  "Comment ameliorer ma lettre de motivation ?",
];

function cleanText(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();
}

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

type TimedMessage = PrivateAssistantMessage & { time?: string };

export function PrivateAssistantView() {
  const [messages, setMessages] = useState<TimedMessage[]>([
    { ...initialMessages[0], time: nowTime() },
  ]);
  const [input, setInput] = useState("");
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
    if (!content || isSending) return;

    const userMsg: TimedMessage = { role: "user", content, time: nowTime() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await sendPrivateAssistantMessage({
        conversationId,
        messages: nextMessages.map(({ role, content: c }) => ({ role, content: c })),
      });

      setConversationId(response.conversation_id ?? conversationId);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: cleanText(response.answer), time: nowTime() },
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
          time: nowTime(),
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
    <div className="pas-page">
      <div className="pas-header">
        <MessageCircle size={28} className="pas-header-icon" />
        <div>
          <h1>Assistant dossier</h1>
          <p>Posez vos questions sur votre procedure, vos motivations, votre entretien ou vos documents.</p>
        </div>
      </div>

      <div className="pas-chat-card">
        <div className="pas-messages" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div className={`pas-bubble ${msg.role}`} key={i}>
              <p>{msg.content}</p>
              {msg.time ? <span className="pas-bubble-time">{msg.time}</span> : null}
            </div>
          ))}
          {isSending ? (
            <div className="pas-bubble assistant">
              <p>L&apos;assistant prepare une reponse...</p>
            </div>
          ) : null}
        </div>

        {errorMessage ? <div className="portal-warning">{errorMessage}</div> : null}

        <form className="pas-form" onSubmit={handleSubmit}>
          <input
            className="pas-input"
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            type="text"
            value={input}
          />
          <button
            className="pas-send-btn"
            disabled={isSending || !input.trim()}
            type="submit"
            aria-label="Envoyer"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <div className="pas-faq">
        <h2>Questions frequentes</h2>
        <div className="pas-faq-grid">
          {faqItems.map((q) => (
            <button
              className="pas-faq-item"
              disabled={isSending}
              key={q}
              onClick={() => void submitMessage(q)}
              type="button"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="pas-about">
        <Info size={18} className="pas-about-icon" />
        <div>
          <strong>A propos de l&apos;assistant</strong>
          <p>
            L&apos;assistant vous aide a structurer vos idees et a clarifier vos reponses. Pour une
            correction humaine complete de vos documents, vous pouvez demander un accompagnement
            PieAgency ou acheter notre pack correction dossier.
          </p>
        </div>
      </div>
    </div>
  );
}
