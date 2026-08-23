'use client';

import type { ReactNode } from 'react';
import { openAssistantGenie } from '@/lib/assistant-genie-events';

export function AssistantGenieTrigger({
  children,
  className,
  message,
  documentId,
  requestedAction,
  autoSend = false,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  message?: string;
  documentId?: string | null;
  requestedAction?: string;
  autoSend?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={() =>
        openAssistantGenie({
          message,
          documentId,
          requestedAction,
          autoSend,
        })
      }
    >
      {children}
    </button>
  );
}
