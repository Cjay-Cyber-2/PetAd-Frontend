import { useApiQuery } from "../../../hooks/useApiQuery";
import { messagingService } from "../api/messagingService";
import type { Conversation } from "../types";

/**
 * Conversation cache keys:
 * - ["conversations"]                 → the user's conversation list (unread counts live here)
 * - ["conversations", conversationId] → a single conversation thread
 */
export const CONVERSATIONS_QUERY_KEY = ["conversations"] as const;

/**
 * useConversations
 *
 * Loads the current user's conversations. Every unread badge / thread reads
 * from this cache, and live events optimistically rewrite entries here so the
 * derived unread counts update immediately.
 */
export function useConversations() {
  return useApiQuery<Conversation[]>(CONVERSATIONS_QUERY_KEY, () =>
    messagingService.listConversations(),
  );
}
