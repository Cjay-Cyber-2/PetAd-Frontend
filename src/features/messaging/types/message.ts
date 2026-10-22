/**
 * Messaging domain types.
 *
 * A `Conversation` pairs a pet with the user who owns it (the counterparty) and
 * carries the thread of `Message`s exchanged between the two parties. The list
 * endpoint returns conversations for the current user; each entry exposes the
 * counterparty via `ownerId` and carries the running `unreadCount`.
 */

export type MessageStatus = "sending" | "sent" | "failed";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  status?: MessageStatus;
}

export interface Conversation {
  id: string;
  petId: string;
  ownerId: string;
  /** Ordered participant ids — [currentUserId, counterpartyId]. */
  participantIds: [string, string];
  messages?: Message[];
  lastMessage?: Message | null;
  unreadCount: number;
  updatedAt?: string;
}

export interface StartConversationVariables {
  petId: string;
  ownerId: string;
}

/** Variables for sending a message inside a conversation. */
export interface SendMessageVariables {
  conversationId: string;
  senderId: string;
  body: string;
}
