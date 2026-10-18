export type EscrowOnChainStatus = 
  | "PENDING"
  | "SUCCESS"
  | "FAILED";

export interface SettlementPayment {
  id: string;
  amount: number;
  asset: string;
  destination: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
}

export interface SettlementSummary {
  onChainStatus: EscrowOnChainStatus;
  confirmations: number;
  payments: SettlementPayment[];
  stellarExplorerUrl: string;
}

/**
 * Lifecycle of an escrow record, matching the Prisma `Escrow.status` enum as
 * served by the escrow API (and mirrored by `src/mocks/handlers/escrow.ts`).
 */
export const ESCROW_RECORD_STATUSES = [
  "CREATED",
  "FUNDED",
  "RELEASED",
  "REFUNDED",
  "DISPUTED",
] as const;

export type EscrowRecordStatus = (typeof ESCROW_RECORD_STATUSES)[number];
