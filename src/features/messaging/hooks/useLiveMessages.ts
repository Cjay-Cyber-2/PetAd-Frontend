import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CONVERSATIONS_QUERY_KEY } from "./useConversations";
import type { Conversation, Message } from "../types";

/** WebSocket path for the real-time messaging stream. */
const MESSAGING_WS_PATH = "/api/ws/messaging";

interface LiveMessageEvent {
  type: "new_message";
  conversationId: string;
  message: Message;
}

/**
 * useLiveMessages
 *
 * Subscribes to the real-time messaging WebSocket and merges incoming live
 * messages into the React Query cache so the conversation thread and unread
 * counts update immediately without a refetch.
 *
 *  - Appends the live message to the conversation thread
 *  - Rewrites the conversation list entry (lastMessage + updatedAt)
 *  - Increments `unreadCount` on the list entry when the message is not from
 *    the current user
 *  - Reconnects with backoff on abnormal close
 *
 * Must be used inside a component tree that has a QueryClient.
 */
export function useLiveMessages({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const detailKey = useMemo(
    () => ["conversations", conversationId] as const,
    [conversationId],
  );

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const closeSocket = useCallback(() => {
    clearReconnectTimer();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, [clearReconnectTimer]);

  const mergeLiveMessage = useCallback(
    (event: LiveMessageEvent) => {
      if (event.conversationId !== conversationId) return;

      const { message } = event;

      // 1. Append to the conversation thread.
      queryClient.setQueryData<Conversation | undefined>(detailKey, (old) => {
        if (!old) return old;
        const alreadyPresent = old.messages?.some(
          (m) => m.id === message.id,
        );
        if (alreadyPresent) return old;
        return {
          ...old,
          messages: [...(old.messages ?? []), message],
          lastMessage: message,
          updatedAt: message.createdAt,
        };
      });

      // 2. Rewrite the conversation list entry.
      queryClient.setQueryData<Conversation[] | undefined>(
        CONVERSATIONS_QUERY_KEY,
        (list) => {
          if (!list) return list;
          return list.map((c) => {
            if (c.id !== conversationId) return c;
            const isFromCurrentUser = message.senderId === currentUserId;
            return {
              ...c,
              lastMessage: message,
              updatedAt: message.createdAt,
              // Increment unread only when the message is from the counterparty.
              unreadCount: isFromCurrentUser
                ? c.unreadCount
                : (c.unreadCount ?? 0) + 1,
            };
          });
        },
      );
    },
    [queryClient, detailKey, conversationId, currentUserId],
  );

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token =
      localStorage.getItem("auth_token") ??
      sessionStorage.getItem("auth_token");
    if (!token) return;

    const protocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}${MESSAGING_WS_PATH}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        if (typeof event.data !== "string") return;
        try {
          const parsed: unknown = JSON.parse(event.data);
          if (
            parsed !== null &&
            typeof parsed === "object" &&
            (parsed as { type?: unknown }).type === "new_message"
          ) {
            mergeLiveMessage(parsed as LiveMessageEvent);
          }
        } catch {
          // Non-JSON frames are ignored.
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        wsRef.current = null;
        // Attempt reconnection after a short delay.
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 1000);
      };
    } catch {
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 1000);
    }
  }, [mergeLiveMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearReconnectTimer();
      closeSocket();
    };
  }, [connect, clearReconnectTimer, closeSocket]);

  return null;
}
