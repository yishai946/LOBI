import { Message } from '@entities/Message';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export type MessageSortParam = 'new' | 'old' | 'asc' | 'desc';

export interface CreateMessagePayload {
  title: string;
  content: string;
  isUrgent?: boolean;
  isPinned?: boolean;
}

export interface UpdateMessagePayload {
  title?: string;
  content?: string;
  isUrgent?: boolean;
  isPinned?: boolean;
}

export interface MessageQueryParams extends PaginationParams {
  isUrgent?: boolean;
  sort?: MessageSortParam;
}

export const messageService = {
  getMessages: async (params: MessageQueryParams = {}): Promise<Message[]> => {
    const response = await axiosInstance.get('/messages', { params });
    return response.data;
  },

  createMessage: async (payload: CreateMessagePayload): Promise<Message> => {
    const response = await axiosInstance.post('/messages', payload);
    return response.data.data;
  },

  updateMessage: async (messageId: string, payload: UpdateMessagePayload): Promise<Message> => {
    const response = await axiosInstance.patch(`/messages/${messageId}`, payload);
    return response.data.data;
  },

  deleteMessage: async (messageId: string): Promise<Message> => {
    const response = await axiosInstance.delete(`/messages/${messageId}`);
    return response.data.data;
  },
};
