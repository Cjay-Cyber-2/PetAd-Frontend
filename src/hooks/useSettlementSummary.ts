import { useApiQuery } from "./useApiQuery";
import { escrowService } from "../api/escrowService";
import { queryKeys } from "../lib/queryKeys";
import type { SettlementSummary } from "../types/escrow";

export function useSettlementSummary(escrowId: string) {
  return useApiQuery<SettlementSummary>(
    queryKeys.escrow.summary(escrowId),
    () => escrowService.getSettlementSummary(escrowId),
    {
      enabled: !!escrowId,
    }
  );
}
