import { apiClient } from "../lib/api-client";
import { useApiQuery } from "./useApiQuery";
import type { NotificationPreferences } from "../types/notifications";
import { queryKeys } from "../lib/queryKeys";

// close #C11: per-category notification preference toggles support
export const useNotificationPreferences = () => {
  return useApiQuery<NotificationPreferences>(
    queryKeys.notifications.preferences(),
    () => apiClient.get<NotificationPreferences>("/notifications/preferences"),
  );
};
