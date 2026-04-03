import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationService } from '@api/notificationService';
import { useAuth } from '@providers/AuthContext';
import { useSocket } from '@providers/SocketContext';

const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: (params?: Record<string, unknown>) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export const useNotifications = (limit = 20) => {
  const { isAuthenticated, currentContext } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: notificationQueryKeys.list({ limit }),
    queryFn: () => notificationService.getNotifications({ limit }),
    enabled: isAuthenticated && !!currentContext,
  });

  const unreadCountQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated && !!currentContext,
  });

  // 1. Socket.io Listener (Guaranteed instant foreground update)
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    };

    socket.on('NEW_NOTIFICATION', handleNewNotification);
    return () => {
      socket.off('NEW_NOTIFICATION', handleNewNotification);
    };
  }, [socket, queryClient]);

  // 2. Service Worker Listener (Backup for push events)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    unreadCount: unreadCountQuery.data ?? 0,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
};
