import { useCallback, useRef } from "react";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { useQueryClient } from "@tanstack/react-query";
import { messagingService } from "../api/messagingService";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import type { Conversation, StartConversationVariables } from "../types";

function findExistingConversation(
  conversations: Conversation[] | undefined,
  petId: string,
  ownerId: string,
): Conversation | undefined {
  return (
    conversations?.find(
      (conversation) =>
        conversation.petId === petId &&
        conversation.ownerId === ownerId,
    ) ?? undefined
  );
}

/**
 * useStartConversation
 *
 * Starts (or reuses) a conversation between the current user and the owner of a
 * pet. Existing conversations for the same pet + owner pair are reused from the
 * conversation cache; otherwise a new conversation is created. Rapid repeated
 * clicks are de-duplicated via an in-flight promise map.
 */
export function useStartConversation() {
  const queryClient = useQueryClient();
  const inflightRef = useRef<Map<string, Promise<Conversation>>>(new Map());

  const { mutateAsync, isPending, error } = useApiMutation<Conversation, StartConversationVariables>(
    async ({ petId, ownerId }) => {
      const existing = findExistingConversation(
        queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY),
        petId,
        ownerId,
      );
      if (existing) return existing;
      return messagingService.createConversation(petId, ownerId);
    },
    {
      invalidates: [["conversations"]],
    },
  );

  const startConversation = useCallback(
    async (variables: StartConversationVariables): Promise<Conversation> => {
      const key = `${variables.petId}:${variables.ownerId}`;
      const existing = findExistingConversation(
        queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY),
        variables.petId,
        variables.ownerId,
      );
      if (existing) return existing;

      const inFlight = inflightRef.current.get(key);
      if (inFlight) return inFlight;

      const promise = mutateAsync(variables).finally(() => {
        if (inFlightRef.current.get(key) === promise) {
          inFlightRef.current.delete(key);
        }
      });
      inflightRef.current.set(key, promise);
      return promise;
    },
    [mutateAsync, queryClient],
  );

  return { startConversation, isPending, error };
}
