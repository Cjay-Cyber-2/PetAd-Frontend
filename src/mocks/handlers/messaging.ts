/**
 * messaging.ts — MSW handlers for the in-app messaging domain.
 *
 * All endpoints require a Bearer token (401 otherwise).
 * Conversation/message state is held in module memory and reset between tests
 * via `server.resetHandlers()` (module state is re-created on each import in
 * Vitest, but we also expose `resetMessagingStore` for explicit control).
 */

import { http, HttpResponse, delay } from "msw";

const DELAY_MS = 200;

interface StoredMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  status?: "sending" | "sent" | "failed";
}

interface StoredConversation {
  id: string;
  petId: string;
  ownerId: string;
  participantIds: [string, string];
  messages: StoredMessage[];
  lastMessage?: StoredMessage | null;
  unreadCount: number;
  updatedAt?: string;
}

let conversations: StoredConversation[] = [
  {
    id: "conv-1",
    petId: "pet-1",
    ownerId: "user-owner-1",
    participantIds: ["user-current", "user-owner-1"],
    messages: [
      {
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-owner-1",
        recipientId: "user-current",
        body: "Hi, is this pet still available?",
        createdAt: new Date(Date.now() - 60_000).toISOString(),
        status: "sent",
      },
    ],
    lastMessage: {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-owner-1",
      recipientId: "user-current",
      body: "Hi, is this pet still available?",
      createdAt: new Date(Date.now() - 60_000).toISOString(),
      status: "sent",
    },
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 60_000).toISOString(),
  },
];

let messageIdCounter = 100;

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get("Authorization") ?? "";
  return auth.startsWith("Bearer ") && auth.length > 7;
}

function requireAuth() {
  return new HttpResponse(null, { status: 401 });
}

function nowIso(): string {
  return new Date().toISOString();
}

function findConversation(id: string): StoredConversation | undefined {
  return conversations.find((c) => c.id === id);
}

export function resetMessagingStore(): void {
  conversations = [
    {
      id: "conv-1",
      petId: "pet-1",
      ownerId: "user-owner-1",
      participantIds: ["user-current", "user-owner-1"],
      messages: [
        {
          id: "msg-1",
          conversationId: "conv-1",
          senderId: "user-owner-1",
          recipientId: "user-current",
          body: "Hi, is this pet still available?",
          createdAt: new Date(Date.now() - 60_000).toISOString(),
          status: "sent",
        },
      ],
      lastMessage: {
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-owner-1",
        recipientId: "user-current",
        body: "Hi, is this pet still available?",
        createdAt: new Date(Date.now() - 60_000).toISOString(),
        status: "sent",
      },
      unreadCount: 1,
      updatedAt: new Date(Date.now() - 60_000).toISOString(),
    },
  ];
  messageIdCounter = 100;
}

export const messagingHandlers = [
  // GET /api/conversations — list the current user's conversations
  http.get("/api/conversations", async ({ request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    return HttpResponse.json<StoredConversation[]>(conversations);
  }),

  // GET /api/conversations/:id — single conversation thread
  http.get("/api/conversations/:id", async ({ params, request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    const { id } = params;
    const conversation = findConversation(String(id));
    if (!conversation) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json<StoredConversation>(conversation);
  }),

  // POST /api/conversations — start a conversation for a pet + owner
  http.post("/api/conversations", async ({ request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    const body = (await request.json()) as {
      petId?: string;
      ownerId?: string;
    };
    if (!body.petId || !body.ownerId) {
      return new HttpResponse(
        JSON.stringify({ message: "petId and ownerId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const existing = conversations.find(
      (c) => c.petId === body.petId && c.ownerId === body.ownerId,
    );
    if (existing) {
      return HttpResponse.json<StoredConversation>(existing);
    }

    const conversation: StoredConversation = {
      id: `conv-${Date.now()}`,
      petId: body.petId,
      ownerId: body.ownerId,
      participantIds: ["user-current", body.ownerId],
      messages: [],
      lastMessage: null,
      unreadCount: 0,
      updatedAt: nowIso(),
    };
    conversations = [conversation, ...conversations];
    return HttpResponse.json<StoredConversation>(conversation, { status: 201 });
  }),

  // POST /api/conversations/:id/messages — send a message
  http.post("/api/conversations/:id/messages", async ({ params, request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    const { id } = params;
    const conversation = findConversation(String(id));
    if (!conversation) {
      return new HttpResponse(null, { status: 404 });
    }

    const body = (await request.json()) as {
      conversationId?: string;
      body?: string;
    };
    if (!body.body) {
      return new HttpResponse(
        JSON.stringify({ message: "Message body is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const message: StoredMessage = {
      id: `msg-${++messageIdCounter}`,
      conversationId: String(id),
      senderId: "user-current",
      recipientId: conversation.ownerId,
      body: body.body,
      createdAt: nowIso(),
      status: "sent",
    };

    conversation.messages.push(message);
    conversation.lastMessage = message;
    conversation.updatedAt = message.createdAt;

    return HttpResponse.json<StoredMessage>(message, { status: 201 });
  }),

  // PATCH /api/conversations/:id/read — mark conversation as read
  http.patch("/api/conversations/:id/read", async ({ params, request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    const { id } = params;
    const conversation = findConversation(String(id));
    if (!conversation) {
      return new HttpResponse(null, { status: 404 });
    }
    conversation.unreadCount = 0;
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/users/block — block a conversation partner
  http.post("/api/users/block", async ({ request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/users/unblock — lift a previously issued block
  http.post("/api/users/unblock", async ({ request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/reports — file a report against a conversation partner
  http.post("/api/reports", async ({ request }) => {
    await delay(DELAY_MS);
    if (!isAuthorized(request)) return requireAuth();
    const body = (await request.json()) as {
      conversationId?: string;
      reason?: string;
    };
    if (!body.conversationId || !body.reason) {
      return new HttpResponse(
        JSON.stringify({ message: "conversationId and reason are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    return HttpResponse.json({ reportId: `report-${Date.now()}` });
  }),
];
