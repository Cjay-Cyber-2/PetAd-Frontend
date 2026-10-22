import { useCallback, useState } from "react";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { messagingService } from "../api/messagingService";
import { reportConversationSchema } from "../schemas/messagingSchemas";
import type { ReportConversationInput } from "../schemas/messagingSchemas";

/** localStorage key so a submitted report is not re-sent on refresh. */
export const REPORTED_CONVERSATIONS_STORAGE_KEY =
  "petad:messaging:reported_conversations";

function readReportedConversations(): string[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(REPORTED_CONVERSATIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function persistReportedConversations(ids: string[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      REPORTED_CONVERSATIONS_STORAGE_KEY,
      JSON.stringify(ids),
    );
  } catch {
    // Storage unavailable — keep in-memory state only.
  }
}

/**
 * useReportConversation
 *
 * Files a report against a conversation partner:
 *  - Validates the payload with Zod before it reaches the API
 *  - Persists the reported conversation id locally (survives refreshes)
 *  - Exposes `hasReported` lookups so the UI can suppress re-reporting
 *  - Returns a confirmation message that avoids the counterparty's private data
 */
export function useReportConversation() {
  const [reportedConversationIds, setReportedConversationIds] =
    useState<string[]>(readReportedConversations);
  const [reportConfirmation, setReportConfirmation] = useState<string | null>(
    null,
  );

  const { mutate, isPending: isReporting, error } = useApiMutation<
    { reportId?: string },
    ReportConversationInput
  >(async (payload) => {
    // Zod validation is applied at the call site (ReportConversationDialog);
    // we also re-validate here as a defense-in-depth measure.
    const parsed = reportConversationSchema.parse(payload);
    return messagingService.report(parsed);
  }, {
    invalidates: [["conversations"]],
    onSuccess: (data) => {
      const id = data?.reportId;
      if (id) {
        setReportedConversationIds((prev) => {
          const next = prev.includes(id) ? prev : [...prev, id];
          persistReportedConversations(next);
          return next;
        });
      }
      setReportConfirmation(
        id
          ? "Your report has been submitted. Our team will review it."
          : "Your report has been submitted. Our team will review it.",
      );
    },
  });

  const reportConversation = useCallback(
    (input: ReportConversationInput) => {
      setReportConfirmation(null);
      mutate(input);
    },
    [mutate],
  );

  const clearConfirmation = useCallback(() => {
    setReportConfirmation(null);
  }, []);

  const hasReported = useCallback(
    (conversationId: string) => reportedConversationIds.includes(conversationId),
    [reportedConversationIds],
  );

  return {
    reportConversation,
    isReporting,
    error,
    reportConfirmation,
    clearConfirmation,
    hasReported,
  };
}
