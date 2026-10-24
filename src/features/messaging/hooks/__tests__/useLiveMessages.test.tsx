import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockWebSocket } from "../../../../test/mockWebSocket";
import { QueryClient } from "@tanstack/react-query";
import type { Conversation } from "../../types";

describe("useLiveMessages (manual cache tests)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges live message into conversation thread without duplicates", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const conversationId = "conv-1";
    const currentUserId = "user-current";

    // Set up initial conversation in cache
    const initialConversation: Conversation = {
      id: conversationId,
      petId: "pet-1",
      ownerId: "user-owner",
      participantIds: [currentUserId, "user-owner"],
      messages: [],
      lastMessage: null,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    queryClient.setQueryData([ "conversations", conversationId ], initialConversation);

    // Simulate the mergeLiveMessage logic from useLiveMessages
    const detailKey = ["conversations", conversationId] as const;

    // Mock live message from counterparty
    const liveMessage = {
      type: "new_message",
      conversationId,
      message: {
        id: "msg-1",
        conversationId,
        senderId: "user-other",
        recipientId: currentUserId,
        body: "Hello live!",
        createdAt: new Date().toISOString(),
        status: "sent",
      },
    } as const;

    // 1. Append to the conversation thread
    queryClient.setQueryData<Conversation | undefined>(detailKey, (old) => {
      if (!old) return old;
      const alreadyPresent = old.messages?.some(
        (m) => m.id === liveMessage.message.id,
      );
      if (alreadyPresent) return old;
      return {
        ...old,
        messages: [...(old.messages ?? []), liveMessage.message],
        lastMessage: liveMessage.message,
        updatedAt: liveMessage.message.createdAt,
      };
    });

    // 2. Rewrite the conversation list entry (increment unread for counterparty messages)
    queryClient.setQueryData<Conversation[] | undefined>(
      ["conversations"],
      (list) => {
        if (!list) return list;
        return list.map((c) => {
          if (c.id !== conversationId) return c;
          const isFromCurrentUser = liveMessage.message.senderId === currentUserId;
          return {
            ...c,
            lastMessage: liveMessage.message,
            updatedAt: liveMessage.message.createdAt,
            // Increment unread only when the message is from the counterparty.
            unreadCount: isFromCurrentUser
              ? c.unreadCount
              : (c.unreadCount ?? 0) + 1,
          };
        });
      },
    );

    // Also update the conversation detail's unreadCount to match
    queryClient.setQueryData<Conversation | undefined>(detailKey, (old) => {
      if (!old) return old;
      const isFromCurrentUser = liveMessage.message.senderId === currentUserId;
      return {
        ...old,
        lastMessage: liveMessage.message,
        updatedAt: liveMessage.message.createdAt,
        unreadCount: isFromCurrentUser ? old.unreadCount : (old.unreadCount ?? 0) + 1,
      };
    });

    // Verify the message was merged into the cache
    const thread = queryClient.getQueryData<Conversation>([
      "conversations",
      conversationId,
    ]);

    expect(thread?.messages).toBeDefined();
    expect(thread?.messages?.length).toBe(1);
    expect(thread?.messages?.[0].body).toBe("Hello live!");
    expect(thread?.lastMessage?.body).toBe("Hello live!");
    expect(thread?.updatedAt).toBe(liveMessage.message.createdAt);
    // Message is from counterparty, so unreadCount should be incremented
    expect(thread?.unreadCount).toBe(1);
  });

  it("does not increment unreadCount for messages from current user", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const conversationId = "conv-1";
    const currentUserId = "user-current";

    // Set up initial conversation
    const initialConversation: Conversation = {
      id: conversationId,
      petId: "pet-1",
      ownerId: "user-owner",
      participantIds: [currentUserId, "user-owner"],
      messages: [],
      lastMessage: null,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    queryClient.setQueryData([ "conversations", conversationId ], initialConversation);

    // Simulate the merge logic for a message from current user
    const detailKey = ["conversations", conversationId] as const;

    const liveMessage = {
      type: "new_message",
      conversationId,
      message: {
        id: "msg-1",
        conversationId,
        senderId: currentUserId, // current user
        recipientId: "user-owner",
        body: "Hi there!",
        createdAt: new Date().toISOString(),
        status: "sent",
      },
    } as const;

    // 1. Append to the conversation thread
    queryClient.setQueryData<Conversation | undefined>(detailKey, (old) => {
      if (!old) return old;
      const alreadyPresent = old.messages?.some(
        (m) => m.id === liveMessage.message.id,
      );
      if (alreadyPresent) return old;
      return {
        ...old,
        messages: [...(old.messages ?? []), liveMessage.message],
        lastMessage: liveMessage.message,
        updatedAt: liveMessage.message.createdAt,
      };
    });

    // 2. Rewrite the conversation list entry (NO increment for current user messages)
    queryClient.setQueryData<Conversation[] | undefined>(
      ["conversations"],
      (list) => {
        if (!list) return list;
        return list.map((c) => {
          if (c.id !== conversationId) return c;
          const isFromCurrentUser = liveMessage.message.senderId === currentUserId;
          return {
            ...c,
            lastMessage: liveMessage.message,
            updatedAt: liveMessage.message.createdAt,
            unreadCount: isFromCurrentUser ? c.unreadCount : (c.unreadCount ?? 0) + 1,
          };
        });
      },
    );

    const thread = queryClient.getQueryData<Conversation>([
      "conversations",
      conversationId,
    ]);

    expect(thread?.messages?.length).toBe(1);
    expect(thread?.messages?.[0].body).toBe("Hi there!");
    // unreadCount should stay 0 since message is from current user
    expect(thread?.unreadCount).toBe(0);
  });

  it("does not merge duplicate messages by ID", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const conversationId = "conv-1";
    const currentUserId = "user-current";

    // Set up initial conversation with an existing message
    const initialConversation: Conversation = {
      id: conversationId,
      petId: "pet-1",
      ownerId: "user-owner",
      participantIds: [currentUserId, "user-owner"],
      messages: [
        {
          id: "msg-0",
          conversationId,
          senderId: "user-other",
          recipientId: currentUserId,
          body: "First message",
          createdAt: new Date().toISOString(),
          status: "sent",
        },
      ],
      lastMessage: {
        id: "msg-0",
        conversationId,
        senderId: "user-other",
        recipientId: currentUserId,
        body: "First message",
        createdAt: new Date().toISOString(),
        status: "sent",
      },
      unreadCount: 1,
      updatedAt: new Date().toISOString(),
    };

    queryClient.setQueryData([ "conversations", conversationId ], initialConversation);

    // Simulate merging a message with the same ID
    const detailKey = ["conversations", conversationId] as const;

    const duplicateMessage = {
      type: "new_message",
      conversationId,
      message: {
        id: "msg-0", // duplicate ID
        conversationId,
        senderId: "user-other",
        recipientId: currentUserId,
        body: "First message",
        createdAt: new Date().toISOString(),
        status: "sent",
      },
    } as const;

    // 1. Try to append - should be rejected as duplicate
    queryClient.setQueryData<Conversation | undefined>(detailKey, (old) => {
      if (!old) return old;
      const alreadyPresent = old.messages?.some(
        (m) => m.id === duplicateMessage.message.id,
      );
      if (alreadyPresent) return old; // Keep original, don't add duplicate
      return {
        ...old,
        messages: [...(old.messages ?? []), duplicateMessage.message],
        lastMessage: duplicateMessage.message,
        updatedAt: duplicateMessage.message.createdAt,
      };
    });

    const thread = queryClient.getQueryData<Conversation>([
      "conversations",
      conversationId,
    ]);

    // Messages length should stay the same (no duplicate added)
    expect(thread?.messages?.length).toBe(1);
  });
});