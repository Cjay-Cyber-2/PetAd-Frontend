import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../../api/custodyService";
import { queryKeys } from "../queryKeys";

export function useCustodyDetails(custodyId: string | undefined) {
  const enabled = Boolean(custodyId);

  const query = useQuery({
    queryKey: queryKeys.custody.detail(custodyId ?? ""),
    queryFn: () => custodyService.getDetails(custodyId!),
    enabled,
    // Custody history is immutable after recording, so the shared cache is sufficient.
    staleTime: 30_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
