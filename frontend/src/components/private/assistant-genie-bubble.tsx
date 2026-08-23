'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useAuthSession } from '@/hooks/use-auth-session';
import { getApiBaseUrl } from '@/lib/auth';
import {
  ASSISTANT_GENIE_OPEN_EVENT,
  type AssistantGenieOpenDetail,
} from '@/lib/assistant-genie-events';
import {
  sendCandidateAssistantMessage,
  type CandidateAssistantResponse,
} from '@/lib/private-assistant';
import { fetchProgressivePath, type ProgressivePath } from '@/lib/progressive-path';

type BubbleMessage = {
  role: 'user' | 'assistant';
  content: string;
  meta?: CandidateAssistantResponse;
};

const WELCOME_MESSAGE: BubbleMessage = {
  role: 'assistant',
  content:
    "Bonjour, je suis Assistant.genie. Je connais votre parcours PieAgency, vos étapes, vos blocages et l'état de vos documents. Dites-moi ce que vous voulez comprendre ou accomplir maintenant.",
};

export function AssistantGenieBubble() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const { session, isReady } = useAuthSession(apiBaseUrl);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BubbleMessage[]>([WELCOME_MESSAGE]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [path, setPath] = useState<ProgressivePath | null>(null);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState('page_guidance');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const userId = session?.user.user_id ?? null;
  const canUseAssistant =
    isReady && Boolean(session) && ['student', 'admin'].includes(session?.user.role ?? '');

  const historyKey = userId ? `pieagency.assistant.genie.history.${userId}` : null;
  const conversationKey = userId ? `pieagency.assistant.genie.conversation.${userId}` : null;

  useEffect(() => {
    if (!historyKey || !conversationKey) return;
    try {
      const raw = window.localStorage.getItem(historyKey);
      const savedConversation = window.localStorage.getItem(conversationKey);
      if (raw) {
        const parsed = JSON.parse(raw) as BubbleMessage[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed.slice(-40));
      }
      setConversationId(savedConversation || null);
    } catch {
      setMessages([WELCOME_MESSAGE]);
      setConversationId(null);
    }
  }, [historyKey, conversationKey]);

  useEffect(() => {
    if (!historyKey) return;
    try {
      window.localStorage.setItem(historyKey, JSON.stringify(messages.slice(-40)));
    } catch {
      // Local persistence is optional.
    }
  }, [historyKey, messages]);

  useEffect(() => {
    if (!conversationKey) return;
    try {
      if (conversationId) window.localStorage.setItem(conversationKey, conversationId);
      else window.localStorage.removeItem(conversationKey);
    } catch {
      // Local persistence is optional.
    }
  }, [conversationId, conversationKey]);

  useEffect(() => {
    if (!open) return;
    void fetchProgressivePath().then(setPath).catch(() => setPath(null));
  }, [open, pathname]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, isSending, open]);

  async function sendMessage(
    raw: string,
    options?: { documentId?: string | null; requestedAction?: string },
  ) {
    const content = raw.trim();
    if (!content || isSending) return;

    setMessages((current) => [...current, { role: 'user', content }]);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const response = await sendCandidateAssistantMessage({
        message: content,
        context_source: 'private_app',
        current_step_id: path?.current_step?.id ?? null,
        conversation_id: conversationId,
        requested_action: options?.requestedAction ?? pendingAction ?? 'page_guidance',
        document_id: options?.documentId ?? pendingDocumentId,
        page_path: pathname,
      });
      setConversationId(response.conversation_id ?? null);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.answer, meta: response },
      ]);
      setPendingDocumentId(null);
      setPendingAction('page_guidance');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de contacter Assistant.genie pour le moment.",
      );
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AssistantGenieOpenDetail>).detail ?? {};
      setOpen(true);
      setPendingDocumentId(detail.documentId ?? null);
      setPendingAction(detail.requestedAction ?? 'page_guidance');
      if (detail.message) {
        if (detail.autoSend) {
          window.setTimeout(() => {
            void sendMessage(detail.message ?? '', {
              documentId: detail.documentId,
              requestedAction: detail.requestedAction,
            });
          }, 0);
        } else {
          setInput(detail.message);
        }
      }
    };
    window.addEventListener(ASSISTANT_GENIE_OPEN_EVENT, handler);
    return () => window.removeEventListener(ASSISTANT_GENIE_OPEN_EVENT, handler);
    // sendMessage intentionally uses current conversation/page state at event time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, pathname, path?.current_step?.id, isSending]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function resetConversation() {
    setMessages([WELCOME_MESSAGE]);
    setConversationId(null);
    setError('');
    setPendingDocumentId(null);
    setPendingAction('page_guidance');
  }

  if (!canUseAssistant) return null;

  const stepTitle = path?.current_step?.title ?? 'Votre parcours PieAgency';

  return (
    <div className="assistant-genie-root">
      {open ? (
        <section
          className="assistant-genie-panel"
          aria-label="Assistant.genie"
          role="dialog"
          aria-modal="false"
        >
          <header className="assistant-genie-header">
            <div className="assistant-genie-brand">
              <span className="assistant-genie-avatar" aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <div>
                <strong>Assistant.genie</strong>
                <span>{stepTitle}</span>
              </div>
            </div>
            <div className="assistant-genie-header-actions">
              <button type="button" onClick={resetConversation} className="assistant-genie-text-btn">
                Nouveau
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="assistant-genie-icon-btn"
                aria-label="Fermer Assistant.genie"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="assistant-genie-context">
            {path?.current_step ? (
              <>
                <span>
                  Étape {path.current_step.order} · {path.progress_percent}% du parcours
                </span>
                <strong>{path.current_step.next_action || path.current_step.objective}</strong>
              </>
            ) : (
              <span>Assistant connecté à votre espace privé PieAgency.</span>
            )}
          </div>

          <div className="assistant-genie-messages" ref={scrollRef} aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                className={`assistant-genie-message ${message.role}`}
              >
                <div>{message.content}</div>
                {message.role === 'assistant' && message.meta?.used_context?.progressive_path ? (
                  <small>Réponse contextualisée avec votre parcours PieAgency</small>
                ) : null}
              </div>
            ))}
            {isSending ? (
              <div className="assistant-genie-message assistant is-loading">
                <div>Assistant.genie analyse votre contexte…</div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="assistant-genie-error" role="alert">
              {error}
            </div>
          ) : null}

          <form className="assistant-genie-composer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Demandez quoi faire, pourquoi vous êtes bloqué, faites analyser une pièce…"
              rows={2}
              aria-label="Votre message à Assistant.genie"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
            />
            <button type="submit" disabled={!input.trim() || isSending} aria-label="Envoyer">
              <Send size={18} />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className={`assistant-genie-launcher ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Fermer Assistant.genie' : 'Ouvrir Assistant.genie'}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open ? <span>Assistant.genie</span> : null}
      </button>
    </div>
  );
}
