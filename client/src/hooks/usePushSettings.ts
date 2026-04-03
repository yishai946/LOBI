import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pushService, PushSettings } from '@api/pushService';

export const pushQueryKeys = {
  all: ['push-settings'] as const,
  settings: ['push-settings', 'current'] as const,
};

export const usePushSettings = () => {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: pushQueryKeys.settings,
    queryFn: pushService.getSettings,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<PushSettings>) => pushService.updateSettings(settings),
    onSuccess: (data) => {
      // Optimistically update the UI or invalidate query
      queryClient.setQueryData(pushQueryKeys.settings, data);
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending,
  };
};
