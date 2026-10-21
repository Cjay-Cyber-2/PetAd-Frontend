import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import { queryKeys } from "../lib/queryKeys";
import type { AdoptionTimelineEntry } from "../types/adoption";

export function useEscrowTimeline(adoptionId: string) {
  const { data, isLoading, isError } = useApiQuery<AdoptionTimelineEntry[]>(
    queryKeys.adoptions.timeline(adoptionId),
    () => adoptionService.getTimeline(adoptionId)
  );

  const entries = data?.filter((entry) => entry.sdkEvent.startsWith("ESCROW_")) ?? [];

  return {
    entries,
    isLoading,
    isError,
  };
}
