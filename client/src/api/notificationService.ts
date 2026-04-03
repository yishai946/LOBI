import { Notification } from '@entities/Notification';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export interface NotificationQueryParams extends PaginationParams {}

export const notificationService = {
  getNotifications: async (
    params: NotificationQueryParams = {},
  ): Promise<Notification[]> => {
    const response = await axiosInstance.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data.count;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await axiosInstance.patch(
      `/notifications/${notificationId}/read`,
    );
    return response.data.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.patch('/notifications/read-all');
  },
};
