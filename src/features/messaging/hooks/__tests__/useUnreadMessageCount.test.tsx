import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUnreadMessageCount } from "../useUnreadMessageCount";
import type { Conversation } from "../../types";

vi.mock("../useConversations", () => ({
  useConversations: vi.fn(),
}));

import { useConversations } from "../useConversations";

const mockUseConversations = vi.mocked(useConversations);

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
  return { wrapper };
}

const CONV_1: Conversation = {
  id: "conv-1",
  petId: "pet-1",
  ownerId: "user-owner",
  participantIds: ["user-current", "user-owner"],
  unreadCount: 3,
  updatedAt: new Date().toISOString(),
};

const CONV_2: Conversation = {
  id: "conv-2",
  petId: "pet-2",
  ownerId: "user-owner-2",
  participantIds: ["user-current", "user-owner-2"],
  unreadCount: 5,
  updatedAt: new Date().toISOString(),
};

const CONV_READ: Conversation = {
  id: "conv-3",
  petId: "pet-3",
  ownerId: "user-owner-3",
  participantIds: ["user-current", "user-owner-3"],
  unreadCount: 0,
  updatedAt: new Date().toISOString(),
};

describe("useUnreadMessageCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when there are no conversations", () => {
    mockUseConversations.mockReturnValue({ data: undefined, isLoading: false });
    const { result } = renderHook(() => useUnreadMessageCount(), {
      wrapper: createWrapper().wrapper,
    });
    expect(result.current).toBe(0);
  });

  it("sums unread counts across all conversations", () => {
    mockUseConversations.mockReturnValue({
      data: [CONV_1, CONV_2],
      isLoading: false,
    });
    const { result } = renderHook(() => useUnreadMessageCount(), {
      wrapper: createWrapper().wrapper,
    });
    expect(result.current).toBe(8);
  });

  it("ignores conversations with zero unread", () => {
    mockUseConversations.mockReturnValue({
      data: [CONV_1, CONV_READ],
      isLoading: false,
    });
    const { result } = renderHook(() => useUnreadMessageCount(), {
      wrapper: createWrapper().wrapper,
    });
    expect(result.current).toBe(3);
  });

  it("returns 0 when all conversations are read", () => {
    mockUseConversations.mockReturnValue({
      data: [CONV_READ],
      isLoading: false,
    });
    const { result } = renderHook(() => useUnreadMessageCount(), {
      wrapper: createWrapper().wrapper,
    });
    expect(result.current).toBe(0);
  });
});
