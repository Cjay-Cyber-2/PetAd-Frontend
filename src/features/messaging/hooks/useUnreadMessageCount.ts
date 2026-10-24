import { useConversations } from "./useConversations";

/** Maximum unread badge number before the UI switches to the `99+` cap. */
export const MESSAGES_UNREAD_BADGE_CAP = 99;

/**
 * useUnreadMessageCount
 *
 * Derives the total unread message count from the conversation cache
 * (`["conversations"]`). Because the value is computed from the cached array,
 * optimistic writes performed when a message arrives or a conversation is marked
 * read flow straight through without an extra network round-trip.
 */
export function useUnreadMessageCount(): number {
  const { data, isLoading } = useConversations();

  const conversations = data ?? [];
  const unreadCount = conversations.reduce(
    (total, conversation) => total + (conversation.unreadCount ?? 0),
    0,
  );

  return unreadCount;
}
