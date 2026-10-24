import { useCallback, useState, useEffect } from "react";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

/** localStorage key under which SignInForm persists the logged-in user profile. */
const CURRENT_USER_STORAGE_KEY = "petad_user";

function readCurrentUser(): CurrentUser | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.id === "string"
    ) {
      return parsed as CurrentUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * useCurrentUser
 *
 * Reads the logged-in user profile persisted by `SignInForm` (localStorage key
 * `petad_user`). Returns `null` when no user is logged in. Reactively updates
 * if the storage value changes (e.g. after login/logout in another tab).
 */
export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(() => readCurrentUser());

  useEffect(() => {
    const handleStorage = () => {
      setUser(readCurrentUser());
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const refresh = useCallback(() => {
    setUser(readCurrentUser());
  }, []);

  return { user, refresh };
}
