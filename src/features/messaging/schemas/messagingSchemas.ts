import { z } from "zod";

/**
 * Reasons a user can report a conversation partner. Mirrors the backend enum.
 */
export const REPORT_REASONS = [
  "scam",
  "inappropriate",
  "fake",
  "abuse",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  scam: "Scam / Fraud",
  inappropriate: "Inappropriate Content",
  fake: "Fake Profile",
  abuse: "Animal Abuse Concern",
  other: "Other",
};

/**
 * Payload for reporting a conversation. `details` is optional (max 1000 chars)
 * and is only sent when provided.
 */
export const reportConversationSchema = z.object({
  conversationId: z.string().min(1),
  reporterId: z.string().min(1),
  ownerId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .max(1000)
    .optional()
    .transform((value) => (value === undefined ? undefined : value.trim())),
});

export type ReportConversationInput = z.infer<typeof reportConversationSchema>;

/**
 * Payload for sending a message inside a conversation. Optimistic sends and
 * retries both funnel through this validation before hitting the API.
 */
export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  senderId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
