"use client";

import { BookOpen, ExternalLink, Info, MessageCircle, Send, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CopilotBanner } from "@/components/private/copilot-banner";
import {
  sendCandidateAssistantMessage,
  type CandidateAssistantResource,
  type CandidateAssistantResponse,
} from "@/lib/private-assistant";

/* ── Suggestions by context ── */
const defaultSuggestions = [
  "Comment améliorer mon projet d'études ?",
  "Aide-moi à définir mon projet professionnel.",
  "Que dois-je faire à cette étape ?",
  "Quels documents vérifier maintenant ?",
  "Comment préparer mon entretien Campus France ?",
  "Quels éléments préparer pour le visa ?",
];

const suggestionsByContext: Record<string, string[]> = {
  "prepare-study-project": [
    "Comment structurer mon projet d'études ?",
    "Comment améliorer mon projet d'études ?",
    "Quel lien entre ma formation et mon projet professionnel ?",
    "Comment justifier mon choix de formation ?",
    "Que dois-je mettre en avant dans ma lettre de motivation ?",
    "Aide-moi à définir mon projet professionnel.",
  ],
  "prepare-professional-project": [
    "Aide-moi à définir mon projet professionnel.",
    "Comment décrire mon secteur cible et mes missions ?",
    "Quel lien entre ma formation et mon métier visé ?",
    "Comment améliorer mon projet d'études ?",
    "Que dois-je faire à cette étape ?",
    "Quels documents vérifier maintenant ?",
  ],
  "campus-france-interview": [
    "Comment préparer mon entretien Campus France ?",
    "Quelles questions poser lors de l'entretien ?",
    "Comment présenter mon projet professionnel à l'oral ?",
    "Que vérifier avant l'entretien Campus France ?",
    "Comment améliorer mon projet d'études ?",
    "Comment justifier mon choix de formation ?",
  ],
  "visa": [
    "Quels éléments préparer pour le visa ?",
    "Quels documents vérifier maintenant ?",
    "Quelle est la différence entre le dossier PieAgency et le dépôt officiel ?",
    "Comment structurer mon dossier visa ?",
    "Que dois-je faire à cette étape ?",
    "Aide-moi à définir mon projet professionnel.",
  ],
};

function getSuggestions(context: string | null): string[] {
  if (context && suggestionsByContext[context]) return suggestionsByContext[context];
  return defaultSuggestions;
}

/* ── Helpers ── */
function cleanText(text: string) {
  return text.replace(/\*\*/g, "").replace(/__/g, "").replace(/`/g, "").trim();
}

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function accessLabel(access: CandidateAssistantResource["access"]) {
  if (access === "free") return "Ressource gratuite";
  if (access === "included") return "Inclus dans votre accès";
  return "Produit recommandé pour aller plus loin";
}

/* ── Resource card ── */
function ResourceCard({ resource }: { resource: CandidateAssistantResource }) {
  const locked = resource.access === "premium_locked";
  return (
    <div className="pas-resource-card">
      <div className="pas-resource-header">
        <BookOpen size={14} className="pas-resource-icon" />
        <span className="pas-resource-title">{resource.title}</span>
        {resource.type ? <span className="pas-resource-type">{resource.type}</span> : null}
      </div>
      <span className={`pas-resource-badge pas-resource-badge--${resource.access ?? "free"}`}>
        {accessLabel(resource.access)}
      </span>
      {!locked && resource.summary ? (
        <p className="pas-resource-summary">{resource.summary}</p>
      ) : null}
      {locked && resource.summary ? (
        <p className="pas-resource-summary">{resource.summary}</p>
      ) : null}
      {resource.target_path && !locked ? (
        <a className="pas-resource-btn" href={resource.target_path} target="_blank" rel="noopener noreferrer">
          Ouvrir <ExternalLink size={12} />
        </a>
      ) : locked ? (
        <a className="pas-resource-btn pas-resource-btn--premium" href={resource.target_path ?? "/espace-etudiant/produits"}>
          Voir le produit <ExternalLink size={12} />
        </a>
      ) : null}
    </div>
  );
}

/* ── Message type ── */
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  time?: string;
  meta?: CandidateAssistantResponse;
};

/* ── Inner component (uses useSearchParams) ── */
function AssistantViewInner() {
  const searchParams = useSearchParams();
  const contextParam = searchParams.get("context");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant dossier. Posez-moi vos questions sur votre procédure, vos motivations, votre entretien ou vos documents. Je suis là pour vous aider à structurer vos idées.",
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, isSending]);

  async function submitMessage(rawMessage: string) {
    const content = rawMessage.trim();
    if (!content || isSending) return;

    const userMsg: ChatMessage = { role: "user", content, time: nowTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await sendCandidateAssistantMessage({
        message: content,
        context_source: "progressive_path",
        current_step_id: contextParam ?? null,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanText(response.answer),
          time: nowTime(),
          meta: response,
        },
      ]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de contacter l'assistant pour le moment.",
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Je ne peux pas répondre correctement maintenant. Vous pouvez continuer votre préparation et contacter PieAgency si la question est urgente.",
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

  const suggestions = getSuggestions(contextParam);

  return (
    <div className="pas-page">
      <CopilotBanner />
      <div className="pas-header">
        <MessageCircle size={28} className="pas-header-icon" />
        <div>
          <h1>Assistant dossier</h1>
          <p>Posez vos questions sur votre procédure, vos motivations, votre entretien ou vos documents.</p>
        </div>
      </div>

      {contextParam ? (
        <div className="pas-context-banner">
          <Sparkles size={14} />
          Contexte actif : <strong>{contextParam}</strong> — les réponses sont adaptées à cette étape.
        </div>
      ) : null}

      <div className="pas-chat-card">
        <div className="pas-messages" ref={scrollRef}>
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`pas-bubble ${msg.role}`}>
                <p>{msg.content}</p>
                {msg.time ? <span className="pas-bubble-time">{msg.time}</span> : null}
              </div>

              {/* Badge parcours */}
              {msg.role === "assistant" && msg.meta?.used_context?.progressive_path ? (
                <div className="pas-badge-parcours">
                  <Sparkles size={12} /> Réponse adaptée à votre parcours
                </div>
              ) : null}

              {/* Ressources RAG */}
              {msg.role === "assistant" && msg.meta?.rag?.used && (msg.meta.rag.resources?.length ?? 0) > 0 ? (
                <div className="pas-resources-block">
                  <div className="pas-resources-title">
                    <BookOpen size={14} /> Ressources utiles
                  </div>
                  <div className="pas-resources-grid">
                    {msg.meta.rag.resources!.map((r, ri) => (
                      <ResourceCard key={ri} resource={r} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {isSending ? (
            <div className="pas-bubble assistant">
              <p>L&apos;assistant prépare une réponse...</p>
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
        <h2>Suggestions</h2>
        <div className="pas-faq-grid">
          {suggestions.map((q) => (
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
          <strong>À propos de l&apos;assistant</strong>
          <p>
            L&apos;assistant vous aide à structurer vos idées et à clarifier vos réponses. Il utilise
            votre parcours, vos recommandations et les ressources PieAgency pour vous guider.
            Pour une correction humaine complète de vos documents, vous pouvez demander un
            accompagnement PieAgency ou accéder à notre pack correction dossier.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Exported component (wraps in Suspense for useSearchParams) ── */
export function PrivateAssistantView() {
  return (
    <Suspense fallback={<div className="pas-page"><div className="pas-header"><MessageCircle size={28} /><div><h1>Assistant dossier</h1><p>Chargement...</p></div></div></div>}>
      <AssistantViewInner />
    </Suspense>
  );
}
