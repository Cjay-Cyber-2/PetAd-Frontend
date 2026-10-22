import { useMemo } from "react";
import type { CurrentUser } from "../features/messaging/types/message";

const STORAGE_KEY = "petad_user";

/** Persists the signed-in user's identity (not the token) so the UI can tell "me" from "them". */
export function persistCurrentUser(user: CurrentUser): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, fullName: user.fullName, role: user.role }));
  } catch {
    // Storage unavailable (private mode): the UI degrades to treating every sender as "other".
  }
}

export function readCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      typeof (parsed as CurrentUser).id === "string" &&
      typeof (parsed as CurrentUser).fullName === "string"
    ) {
      return parsed as CurrentUser;
    }
  } catch {
    // fall through
  }
  return null;
}

/** The signed-in user (`null` when unknown). Written by `persistCurrentUser` at login. */
export function useCurrentUser(): CurrentUser | null {
  return useMemo(() => readCurrentUser(), []);
}
