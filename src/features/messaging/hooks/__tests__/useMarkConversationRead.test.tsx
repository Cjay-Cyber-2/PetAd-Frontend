import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMarkConversationRead } from "../useMarkConversationRead";
import { messagingService } from "../../api/messagingService";
import type { Conversation } from "../../types";

vi.mock("../../api/messagingService", () => ({
  messagingService: {
    markRead: vi.fn(),
  },
}));

const mockMarkRead = vi.mocked(messagingService.markRead);

const CONVERSATION: Conversation = {
  id: "conv-1",
  petId: "pet-1",
  ownerId: "user-owner",
  participantIds: ["user-current", "user-owner"],
  unreadCount: 3,
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

describe("useMarkConversationRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimistically sets unreadCount to 0 before the API resolves", async () => {
    let resolveRequest: (() => void) | undefined;
    mockMarkRead.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { queryClient, wrapper } = createWrapper();
    seedConversation(queryClient, CONVERSATION);

    const { result } = renderHook(() => useMarkConversationRead(), { wrapper });

    act(() => {
      result.current.markRead("conv-1");
    });

    await waitFor(() => {
      const thread = queryClient.getQueryData<Conversation>([
        "conversations",
        "conv-1",
      ]);
      expect(thread?.unreadCount).toBe(0);
    });

    const list = queryClient.getQueryData<Conversation[]>(["conversations"]);
    expect(list?.find((c) => c.id === "conv-1")?.unreadCount).toBe(0);

    expect(mockMarkRead).toHaveBeenCalledWith("conv-1");

    await act(async () => {
      resolveRequest?.();
    });
  });

  it("rolls back the unreadCount when the API fails", async () => {
    let rejectRequest: ((reason?: unknown) => void) | undefined;
    mockMarkRead.mockImplementation(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );

    const { queryClient, wrapper } = createWrapper();
    seedConversation(queryClient, CONVERSATION);

    const { result } = renderHook(() => useMarkConversationRead(), { wrapper });

    act(() => {
      result.current.markRead("conv-1");
    });

    await waitFor(() => {
      const thread = queryClient.getQueryData<Conversation>([
        "conversations",
        "conv-1",
      ]);
      expect(thread?.unreadCount).toBe(0);
    });

    await act(async () => {
      rejectRequest?.(new Error("network error"));
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // unreadCount restored to original value after rollback.
    const thread = queryClient.getQueryData<Conversation>([
      "conversations",
      "conv-1",
    ]);
    expect(thread?.unreadCount).toBe(3);

    const list = queryClient.getQueryData<Conversation[]>(["conversations"]);
    expect(list?.find((c) => c.id === "conv-1")?.unreadCount).toBe(3);
  });
});
