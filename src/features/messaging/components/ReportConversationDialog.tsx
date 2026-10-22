import { useState, useCallback, useId } from "react";
import { Flag, CheckCircle } from "lucide-react";
import {
  reportConversationSchema,
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  type ReportConversationInput,
} from "../schemas/messagingSchemas";
import { useReportConversation } from "../hooks/useReportConversation";
import type { Conversation } from "../types";

interface ReportConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId: string;
}

/**
 * ReportConversationDialog
 *
 * Report a conversation partner with reason selection and optional details.
 *
 *  - Validates with Zod (reason required, details capped at 1000 chars)
 *  - Confirms success without exposing the reported user's private data
 *  - Persists the report so it isn't re-submitted on refresh
 */
export function ReportConversationDialog({
  isOpen,
  onClose,
  conversation,
  currentUserId,
}: ReportConversationDialogProps) {
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [formError, setFormError] = useState<string | null>(null);
  const [reason, setReason] = useState<ReportConversationInput["reason"]>("");
  const [details, setDetails] = useState("");
  const titleId = useId();

  const {
    reportConversation,
    isReporting,
    error,
    reportConfirmation,
    clearConfirmation,
  } = useReportConversation();

  const handleClose = useCallback(() => {
    setStep("form");
    setFormError(null);
    setReason("");
    setDetails("");
    clearConfirmation();
    onClose();
  }, [onClose, clearConfirmation]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      const payload: ReportConversationInput = {
        conversationId: conversation.id,
        reporterId: currentUserId,
        ownerId: conversation.ownerId,
        reason,
        details: details.trim() || undefined,
      };

      const parsed = reportConversationSchema.safeParse(payload);
      if (!parsed.success) {
        setFormError("Please select a reason before submitting.");
        return;
      }

      try {
        await new Promise<void>((resolve, reject) => {
          reportConversation(parsed.data);
          const start = Date.now();
          const poll = () => {
            if (reportConfirmation) {
              resolve();
            } else if (error) {
              reject(error);
            } else if (Date.now() - start > 30_000) {
              reject(new Error("Request timed out"));
            } else {
              setTimeout(poll, 50);
            }
          };
          poll();
        });
        setStep("confirmation");
      } catch {
        setFormError("Failed to submit your report. Please try again.");
      }
    },
    [conversation.id, conversation.ownerId, currentUserId, reason, details, reportConversation, error, reportConfirmation],
  );

  if (!isOpen) return null;

  const isConfirmation = step === "confirmation";
  const isFormValid = REPORT_REASONS.includes(reason as ReportConversationInput["reason"]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="relative w-full max-w-[480px] bg-white rounded-2xl p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <Flag size={20} strokeWidth={2} />
        </button>

        {isConfirmation ? (
          <div className="space-y-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle size={24} strokeWidth={2} />
            </div>
            <h2
              id={titleId}
              className="text-[20px] font-bold text-[#0D162B] text-center"
            >
              Report submitted
            </h2>
            <p className="text-sm text-gray-600 text-center">
              {reportConfirmation ?? "Our team will review your report."}
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-[#E84D2A] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[#d4431f] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-4">
            <div>
              <h2
                id={titleId}
                className="text-[20px] font-bold text-[#0D162B]"
              >
                Report this user
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Help us understand what happened. Your report is reviewed
                privately — the other party won&rsquo;t see your details.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportConversationInput["reason"])}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#0D1B2A] focus:ring-2 focus:ring-[#0D1B2A]/20"
              >
                <option value="">Select a reason</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {REPORT_REASON_LABELS[r]}
                  </option>
                ))}
              </select>
              {!isFormValid && reason !== "" && (
                <p className="text-xs text-red-500 mt-1">Please select a valid reason.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#0D1B2A] focus:ring-2 focus:ring-[#0D1B2A]/20 resize-none"
                placeholder="Any additional details you'd like to share…"
                maxLength={1000}
              />
              <p className="text-xs text-gray-400">
                {details.length}/1000
              </p>
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{formError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border-2 border-gray-800 py-3 text-[14px] font-semibold text-gray-800 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReporting || !isFormValid}
                className={`flex-1 rounded-xl py-3 text-[14px] font-semibold text-white transition-colors ${
                  isReporting || !isFormValid
                    ? "opacity-70 cursor-not-allowed"
                    : "bg-[#E84D2A] hover:bg-[#d4431f]"
                }`}
              >
                {isReporting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
