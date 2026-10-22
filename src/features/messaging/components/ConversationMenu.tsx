import { useState } from "react";
import { MoreHorizontal, Block, Flag } from "lucide-react";
import { useBlockConversation } from "../hooks/useBlockConversation";
import { ReportConversationDialog } from "./ReportConversationDialog";
import type { Conversation } from "../types";

interface ConversationMenuProps {
  conversation: Conversation;
  currentUserId: string;
  className?: string;
}

/**
 * ConversationMenu
 *
 * Overflow menu on a conversation thread offering block / report actions.
 *
 *  - Block: persists locally + via API, hides the composer, offers unblock
 *  - Report: opens the report dialog (reason + optional details, Zod validated)
 */
export function ConversationMenu({
  conversation,
  currentUserId,
  className = "",
}: ConversationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { isBlocked, block, unblock, isBlocking } = useBlockConversation();

  const counterpartyId = conversation.ownerId;
  const alreadyBlocked = isBlocked(counterpartyId);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Conversation options"
        aria-haspopup="menu"
        data-testid="conversation-menu-button"
      >
        <MoreHorizontal size={18} strokeWidth={2} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1 text-sm z-50"
          role="menu"
          aria-label="Conversation options"
        >
          {alreadyBlocked ? (
            <button
              type="button"
              onClick={() => {
                unblock(counterpartyId);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              role="menuitem"
              data-testid="unblock-menu-item"
            >
              <Block size={16} strokeWidth={2} />
              Unblock user
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  block(counterpartyId);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                role="menuitem"
                data-testid="block-menu-item"
                disabled={isBlocking}
              >
                <Block size={16} strokeWidth={2} />
                {isBlocking ? "Blocking…" : "Block user"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setReportOpen(true);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                role="menuitem"
                data-testid="report-menu-item"
              >
                <Flag size={16} strokeWidth={2} />
                Report user
              </button>
            </>
          )}
        </div>
      )}

      <ReportConversationDialog
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        conversation={conversation}
        currentUserId={currentUserId}
      />
    </div>
  );
}
