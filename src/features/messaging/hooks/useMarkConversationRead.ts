import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { messagingService } from "../api/messagingService";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import type { Conversation } from "../types";

/**
 * useMarkConversationRead
 *
 * Marks a conversation as read with an optimistic cache update:
 *  1. Flips `unreadCount` to 0 on the conversation thread and the list entry
 *     immediately.
 *  2. Fires the read PATCH.
 *  3. Rolls the optimistic writes back (and re-syncs) when the request fails.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useApiMutation<void, string>(
    (conversationId) => messagingService.markRead(conversationId),
    {
      invalidates: [["conversations"]],
      onOptimisticUpdate: (conversationId) => {
        const detailKey = ["conversations", conversationId] as const;
        const detailSnapshot = queryClient.getQueryData<Conversation>(detailKey);
        const listSnapshot = queryClient.getQueryData<Conversation[]>(
          CONVERSATIONS_QUERY_KEY,
        );

        queryClient.setQueryData<Conversation | undefined>(detailKey, (old) =>
          old ? { ...old, unreadCount: 0 } : old,
        );

        queryClient.setQueryData<Conversation[] | undefined>(
          CONVERSATIONS_QUERY_KEY,
          listSnapshot?.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );

        return {
          conversationId,
          detailSnapshot,
          listSnapshot,
        };
      },
      onRollback: (snapshot) => {
        const context = (snapshot ?? {}) as {
          conversationId?: string;
          detailSnapshot: Conversation | undefined;
          listSnapshot: Conversation[] | undefined;
        };
        if (!context.conversationId) return;
        queryClient.setQueryData<Conversation | undefined>(
          ["conversations", context.conversationId],
          context.detailSnapshot,
        );
        queryClient.setQueryData<Conversation[] | undefined>(
          CONVERSATIONS_QUERY_KEY,
          context.listSnapshot,
        );
      },
    },
  );

  const markRead = (conversationId: string) => mutate(conversationId);

  return { markRead, isPending, isError, error };
}
