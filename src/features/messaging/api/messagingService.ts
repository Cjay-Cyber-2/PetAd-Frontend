import { apiClient } from "../../lib/api-client";
import type { Conversation, Message } from "../types";

/**
 * messagingService
 *
 * Real-time messaging API calls via the api-client.
 */
export const messagingService = {
  /** GET /api/conversations — conversations for the current user. */
  async listConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/conversations");
  },

  /** GET /api/conversations/:id — single conversation with its messages. */
  async getConversation(conversationId: string): Promise<Conversation> {
    return apiClient.get<Conversation>(`/conversations/${conversationId}`);
  },

  /** POST /api/conversations — start a conversation for a pet + owner. */
  async createConversation(petId: string, ownerId: string): Promise<Conversation> {
    return apiClient.post<Conversation>("/conversations", { petId, ownerId });
  },

  /** POST /api/conversations/:id/messages — send a message. */
  async sendMessage(conversationId: string, body: string): Promise<Message> {
    return apiClient.post<Message>(`/conversations/${conversationId}/messages`, {
      conversationId,
      body,
    });
  },

  /** PATCH /api/conversations/:id/read — mark conversation as read. */
  async markRead(conversationId: string): Promise<void> {
    return apiClient.patch(`/conversations/${conversationId}/read`);
  },

  /** POST /api/users/block — block a conversation partner. */
  async blockUser(ownerId: string): Promise<void> {
    return apiClient.post("/users/block", { ownerId });
  },

  /** POST /api/users/unblock — lift a previously issued block. */
  async unblockUser(ownerId: string): Promise<void> {
    return apiClient.post("/users/unblock", { ownerId });
  },

  /** POST /api/reports — file a report against a conversation partner. */
  async report(payload: unknown): Promise<{ reportId?: string }> {
    return apiClient.post<{ reportId?: string }>("/reports", payload);
  },
};
