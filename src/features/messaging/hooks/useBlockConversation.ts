import { useCallback, useState } from "react";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { messagingService } from "../api/messagingService";

/** localStorage key so blocks survive refreshes without a backend round-trip. */
export const BLOCKED_USERS_STORAGE_KEY = "petad:messaging:blocked_users";

function readBlockedUsers(): string[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function persistBlockedUsers(userIds: string[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(userIds));
  } catch {
    // Storage unavailable (private mode) — keep in-memory state only.
  }
}

/**
 * useBlockConversation
 *
 * Blocks a conversation partner:
 *  - persists the block locally (survives refreshes) and via the API,
 *  - exposes `unblock` to restore the thread,
 *  - exposes `isBlocked` lookups used to hide the composer.
 */
export function useBlockConversation() {
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(readBlockedUsers);

  const { mutate: mutateBlock, isPending: isBlocking, error } = useApiMutation<
    void,
    string
  >((ownerId) => messagingService.blockUser(ownerId), {
    invalidates: [["conversations"]],
  });

  const block = useCallback(
    (ownerId: string) => {
      setBlockedUserIds((prev) => {
        const next = prev.includes(ownerId) ? prev : [...prev, ownerId];
        persistBlockedUsers(next);
        return next;
      });
      mutateBlock(ownerId);
    },
    [mutateBlock],
  );

  const unblock = useCallback((ownerId: string) => {
    setBlockedUserIds((prev) => {
      const next = prev.filter((id) => id !== ownerId);
      persistBlockedUsers(next);
      return next;
    });
  }, []);

  const isBlocked = useCallback(
    (ownerId: string) => blockedUserIds.includes(ownerId),
    [blockedUserIds],
  );

  return {
    blockedUserIds,
    isBlocked,
    block,
    unblock,
    isBlocking,
    error,
  };
}
