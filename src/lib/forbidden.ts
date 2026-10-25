import { ForbiddenError } from "./api-errors";

/**
 * Global 403 channel.
 *
 * The query client sits outside React, so it reports forbidden responses here
 * and a mounted listener (see `ForbiddenNotifier`) turns them into a friendly
 * message. This way no screen has to remember to catch a 403 itself, and the
 * raw server message is never shown.
 */
export const FORBIDDEN_MESSAGE = "You don't have permission to do that.";

type Listener = () => void;
const listeners = new Set<Listener>();

export function onForbidden(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notifies listeners when `error` is a 403. Returns whether it was one. */
export function reportIfForbidden(error: unknown): boolean {
  if (!isForbiddenError(error)) return false;
  listeners.forEach((listener) => listener());
  return true;
}

export function isForbiddenError(error: unknown): boolean {
  return (
    error instanceof ForbiddenError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { status?: unknown }).status === 403)
  );
}

/**
 * Message safe to render for `error`: a fixed sentence for 403s, otherwise the
 * error's own message (or `fallback`).
 */
export function userFacingMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isForbiddenError(error)) return FORBIDDEN_MESSAGE;
  return error instanceof Error && error.message ? error.message : fallback;
}
