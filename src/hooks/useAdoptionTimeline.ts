import { useApiQuery } from "./useApiQuery";
import { adoptionService } from "../api/adoptionService";
import { queryKeys } from "../lib/queryKeys";
import type { AdoptionTimelineEntry } from "../types/adoption";

export function useAdoptionTimeline(adoptionId: string) {
  const { data, isLoading, isError } = useApiQuery<AdoptionTimelineEntry[]>(
    queryKeys.adoptions.timeline(adoptionId),
    () => adoptionService.getTimeline(adoptionId)
  );

  return {
    entries: data ?? [],
    isLoading,
    isError,
  };
}
