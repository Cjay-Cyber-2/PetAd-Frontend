import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { messagingService } from "../api/messagingService";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import type {
  Conversation,
  Message,
  SendMessageVariables,
} from "../types";

export interface SendMessageContext {
  conversationId: string;
  detailSnapshot: Conversation | undefined;
  listSnapshot: Conversation[] | undefined;
}

function optimisticMessage(
  vars: SendMessageVariables,
  recipientId: string,
): Message {
  return {
    id: `optimistic-${Date.now()}`,
    conversationId: vars.conversationId,
    senderId: vars.senderId,
    recipientId,
    body: vars.body,
    createdAt: new Date().toISOString(),
    status: "sending",
  };
}

/**
 * useSendMessage
 *
 * Optimistic send with rollback and retry:
 *  1. `onMutate` appends a temporary `sending` message to the conversation
 *     thread and rewrites the conversation list entry.
 *  2. On failure `onRollback` restores both snapshots (temp message removed,
 *     unread counts restored) and the mutation retries.
 *  3. On success the `["conversations"]` prefix is invalidated so the server
 *     truth replaces optimistic state.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isError, error } = useApiMutation<
    Message,
    SendMessageVariables
  >(async (vars) => {
    const conversation = queryClient.getQueryData<Conversation>([
      "conversations",
      vars.conversationId,
    ]);
    const recipientId =
      conversation?.participantIds?.find((id) => id !== vars.senderId) ??
      vars.senderId;

    const optimistic = optimisticMessage(vars, recipientId);
    const detailKey: QueryKey = ["conversations", vars.conversationId];
    queryClient.setQueryData<Conversation>(detailKey, (old) =>
      old ? { ...old, messages: [...(old.messages ?? []), optimistic] } : old,
    );

    const listSnapshot = queryClient.getQueryData<Conversation[]>(
      CONVERSATIONS_QUERY_KEY,
    );
    queryClient.setQueryData<Conversation[] | undefined>(
      CONVERSATIONS_QUERY_KEY,
      listSnapshot?.map((conversation) =>
        conversation.id === vars.conversationId
          ? { ...conversation, lastMessage: optimistic, updatedAt: optimistic.createdAt }
          : conversation,
      ),
    );

    return messagingService.sendMessage(vars.conversationId, vars.body);
  }, {
    retry: 0,
    invalidates: [["conversations"]],
    onOptimisticUpdate: async (vars) => {
      const detailKey: QueryKey = ["conversations", vars.conversationId];
      const detailSnapshot = queryClient.getQueryData<Conversation>(detailKey);
      const listSnapshot = queryClient.getQueryData<Conversation[]>(
        CONVERSATIONS_QUERY_KEY,
      );
      return {
        conversationId: vars.conversationId,
        detailSnapshot,
        listSnapshot,
      };
    },
    onRollback: (snapshot) => {
      const context = (snapshot ?? {}) as SendMessageContext;
      queryClient.setQueryData<Conversation | undefined>(
        ["conversations", context.conversationId] as QueryKey,
        context.detailSnapshot,
      );
      queryClient.setQueryData<Conversation[] | undefined>(
        CONVERSATIONS_QUERY_KEY,
        context.listSnapshot,
      );
    },
  });

  const sendMessage = (variables: SendMessageVariables) => mutate(variables);

  return { sendMessage, mutateAsync, isPending, isError, error };
}
