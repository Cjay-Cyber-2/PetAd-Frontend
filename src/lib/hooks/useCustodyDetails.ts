import { useQuery } from "@tanstack/react-query";
import { custodyService } from "../../api/custodyService";
import { queryKeys } from "../queryKeys";

export function useCustodyDetails(custodyId: string | undefined) {
  const enabled = Boolean(custodyId);

  const query = useQuery({
    queryKey: queryKeys.custody.detail(custodyId ?? ""),
    queryFn: () => custodyService.getDetails(custodyId!),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
