import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useStartConversation } from "../hooks/useStartConversation";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface MessageOwnerButtonProps {
  petId: string;
  ownerId: string;
  className?: string;
}

/**
 * MessageOwnerButton
 *
 * "Message owner" button for pet and custody detail pages.
 *
 *  - Reuses an existing conversation for the same pet + owner pair
 *  - De-duplicates rapid repeated clicks via `useStartConversation`
 *  - Hidden when the current user is the listing owner
 *  - Redirects logged-out users to /login with a return URL
 */
export function MessageOwnerButton({
  petId,
  ownerId,
  className = "",
}: MessageOwnerButtonProps) {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { startConversation, isPending } = useStartConversation();

  const handleLoginRedirect = useCallback(() => {
    navigate(
      `/login?returnTo=${encodeURIComponent(window.location.pathname)}`,
      { replace: true },
    );
  }, [navigate]);

  const handleStartConversation = useCallback(() => {
    void startConversation({ petId, ownerId });
  }, [startConversation, petId, ownerId]);

  // Not logged in — redirect to login with a return URL so the user can
  // resume the conversation flow after signing in.
  if (!user) {
    return (
      <button
        type="button"
        onClick={handleLoginRedirect}
        className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 ${className}`}
        data-testid="message-owner-button"
        aria-label="Message owner"
      >
        <MessageCircle size={16} strokeWidth={2} />
        Message owner
      </button>
    );
  }

  // Your own listing — hide the button.
  if (user.id === ownerId) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleStartConversation}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors ${
        isPending ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-50"
      } ${className}`}
      data-testid="message-owner-button"
      aria-label={isPending ? "Starting conversation…" : "Message owner"}
    >
      {isPending ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <MessageCircle size={16} strokeWidth={2} />
      )}
      {isPending ? "Starting…" : "Message owner"}
    </button>
  );
}
