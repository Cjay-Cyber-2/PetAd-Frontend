import { Link, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useUnreadMessageCount } from "../hooks/useUnreadMessageCount";

/** Maximum unread badge number before the UI switches to the `99+` cap. */
export const MESSAGES_UNREAD_BADGE_CAP = 99;

/**
 * MessagesLink
 *
 * Navigation link to the conversations inbox with a live unread-message badge.
 *
 *  - Badge is capped at `99+`
 *  - Accessible label reads `Messages, N unread`
 *  - Count is derived from the conversation cache, so it updates when messages
 *    arrive or conversations are marked read
 */
export function MessagesLink() {
  const location = useLocation();
  const unreadCount = useUnreadMessageCount();
  const displayCount = Math.min(unreadCount, MESSAGES_UNREAD_BADGE_CAP);
  const isActive = location.pathname === "/messages" ||
    location.pathname.startsWith("/messages/");

  const ariaLabel =
    unreadCount === 0
      ? "Messages"
      : `Messages, ${unreadCount} unread`;

  return (
    <Link
      to="/messages"
      className={`relative p-2.5 rounded-full transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-600"
          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
      }`}
      aria-label={ariaLabel}
    >
      <MessageCircle size={20} strokeWidth={2} />
      {unreadCount > 0 ? (
        <span
          data-testid="messages-unread-badge"
          className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white border-2 border-white"
          aria-hidden="true"
        >
          {displayCount >= MESSAGES_UNREAD_BADGE_CAP ? "99+" : displayCount}
        </span>
      ) : null}
    </Link>
  );
}
