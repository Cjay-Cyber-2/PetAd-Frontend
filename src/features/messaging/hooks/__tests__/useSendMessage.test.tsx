import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSendMessage } from "../useSendMessage";
import { messagingService } from "../../api/messagingService";
import type { Conversation, Message } from "../../types";

vi.mock("../../api/messagingService", () => ({
  messagingService: {
    sendMessage: vi.fn(),
  },
}));

const mockSendMessage = vi.mocked(messagingService.sendMessage);

const CONVERSATION: Conversation = {
  id: "conv-1",
  petId: "pet-1",
  ownerId: "user-owner",
  participantIds: ["user-current", "user-owner"],
  messages: [],
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

function seedConversation(queryClient: QueryClient, conversation: Conversation) {
  queryClient.setQueryData<Conversation>(["conversations", "conv-1"], conversation);
  queryClient.setQueryData<Conversation[]>(["conversations"], [conversation]);
}

describe("useSendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("optimistically appends a sending message to the thread", async () => {
    let resolveRequest: (() => void) | undefined;
    mockSendMessage.mockImplementation(
      () =>
        new Promise<Message>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { queryClient, wrapper } = createWrapper();
    seedConversation(queryClient, CONVERSATION);

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    act(() => {
      result.current.sendMessage({
        conversationId: "conv-1",
        senderId: "user-current",
        body: "Hello?",
      });
    });

    // While in flight, the optimistic message is present in the thread.
    await waitFor(() => {
      const thread = queryClient.getQueryData<Conversation>([
        "conversations",
        "conv-1",
      ]);
      const optimistic = thread?.messages?.find((m) => m.status === "sending");
      expect(optimistic?.body).toBe("Hello?");
      expect(optimistic?.id).toContain("optimistic-");
    });

    expect(mockSendMessage).toHaveBeenCalledWith("conv-1", "Hello?");

    await act(async () => {
      resolveRequest?.({
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-current",
        recipientId: "user-owner",
        body: "Hello?",
        createdAt: new Date().toISOString(),
        status: "sent",
      });
    });
  });

  it("rolls back the optimistic message when the API fails", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("network error"));

    const { queryClient, wrapper } = createWrapper();
    seedConversation(queryClient, CONVERSATION);

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    act(() => {
      result.current.sendMessage({
        conversationId: "conv-1",
        senderId: "user-current",
        body: "Hello?",
      });
    });

    // Wait for the optimistic message to appear in the thread.
    await waitFor(() => {
      const thread = queryClient.getQueryData<Conversation>([
        "conversations",
        "conv-1",
      ]);
      expect(thread?.messages?.some((m) => m.status === "sending")).toBe(true);
    });

    // Now trigger the rejection to happen (if not already triggered by mock)
    // and wait for rollback to complete.
    // With retry: 0, the mutation should fail immediately and onRollback should restore the cache.

    // Verify the optimistic message was removed (rolled back).
    const thread = queryClient.getQueryData<Conversation>(["conversations", "conv-1"]);
    expect(thread?.messages?.some((m) => m.status === "sending")).toBe(false);
  });

  it("allows successful send message", async () => {
    mockSendMessage.mockResolvedValueOnce({
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-current",
      recipientId: "user-owner",
      body: "Hello?",
      createdAt: new Date().toISOString(),
      status: "sent",
    });

    const { queryClient, wrapper } = createWrapper();
    seedConversation(queryClient, CONVERSATION);

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    act(() => {
      result.current.sendMessage({
        conversationId: "conv-1",
        senderId: "user-current",
        body: "Hello?",
      });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(mockSendMessage).toHaveBeenCalledWith("conv-1", "Hello?");
    expect(result.current.isError).toBe(false);
  });
});