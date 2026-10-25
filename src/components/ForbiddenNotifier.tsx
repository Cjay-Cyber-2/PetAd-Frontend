import { useEffect } from "react";
import { useToast } from "./toast/useToast";
import { FORBIDDEN_MESSAGE, onForbidden } from "../lib/forbidden";

/** Shows a toast whenever any request is rejected with a 403. Render once, inside `ToastProvider`. */
export function ForbiddenNotifier() {
  const { showToast } = useToast();

  useEffect(
    () =>
      onForbidden(() =>
        showToast({
          type: "error",
          title: "Access denied",
          message: FORBIDDEN_MESSAGE,
        }),
      ),
    [showToast],
  );

  return null;
}
