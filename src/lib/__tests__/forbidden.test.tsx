import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiError, ForbiddenError } from "../api-errors";
import {
  FORBIDDEN_MESSAGE,
  isForbiddenError,
  onForbidden,
  reportIfForbidden,
  userFacingMessage,
} from "../forbidden";
import { queryClient } from "../query-client";
import { ForbiddenNotifier } from "../../components/ForbiddenNotifier";
import { ToastProvider } from "../../components/toast/ToastProvider";

describe("forbidden channel", () => {
  it("notifies listeners for a ForbiddenError and for a bare 403", () => {
    const listener = vi.fn();
    const off = onForbidden(listener);

    expect(reportIfForbidden(new ForbiddenError("no"))).toBe(true);
    expect(reportIfForbidden({ status: 403 })).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);

    off();
    reportIfForbidden(new ForbiddenError("no"));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("ignores other errors", () => {
    const listener = vi.fn();
    const off = onForbidden(listener);

    expect(reportIfForbidden(new ApiError("boom", { status: 500 }))).toBe(false);
    expect(reportIfForbidden(new Error("x"))).toBe(false);
    expect(reportIfForbidden(null)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    off();
  });

  it("never exposes the raw server message for a 403", () => {
    const error = new ForbiddenError("SELECT * FROM admins -- stack trace");
    expect(isForbiddenError(error)).toBe(true);
    expect(userFacingMessage(error)).toBe(FORBIDDEN_MESSAGE);
    expect(userFacingMessage(error)).not.toContain("stack");
  });

  it("falls back for non-403 errors", () => {
    expect(userFacingMessage(new Error("Nope"))).toBe("Nope");
    expect(userFacingMessage("weird", "Fallback")).toBe("Fallback");
  });
});

describe("global handler", () => {
  it("shows a friendly toast when a query fails with a 403", async () => {
    render(
      <ToastProvider>
        <ForbiddenNotifier />
      </ToastProvider>,
    );

    const cache = queryClient.getQueryCache();
    await act(async () => {
      // Drive the real cache's onError, exactly as a failed query would.
      cache.config.onError?.(new ForbiddenError("raw backend text"), {} as never);
    });

    expect(await screen.findByText("Access denied")).toBeTruthy();
    expect(screen.getByText(FORBIDDEN_MESSAGE)).toBeTruthy();
    expect(screen.queryByText("raw backend text")).toBeNull();
  });
});
