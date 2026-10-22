import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { messagingService } from "../api/messagingService";
import type { Conversation } from "../types";

/**
 * useConversation
 *
 * Loads a single conversation thread. The cache key
 * `["conversations", conversationId]` is a child of the list key
 * `["conversations"]`, so invalidations of the list prefix also refresh threads.
 */
export function useConversation(conversationId?: string) {
  const queryKey: QueryKey = conversationId
    ? ["conversations", conversationId]
    : ["conversations"];

  return useApiQuery<Conversation>(
    queryKey,
    () => messagingService.getConversation(conversationId as string),
    { enabled: Boolean(conversationId) },
  );
}
