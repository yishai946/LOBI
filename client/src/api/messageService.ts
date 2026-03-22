import { Message } from '@entities/Message';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export type MessageSortParam = 'new' | 'old' | 'asc' | 'desc';

export interface MessageQueryParams extends PaginationParams {
  isUrgent?: boolean;
  sort?: MessageSortParam;
}

export const messageService = {
  getMessages: async (params: MessageQueryParams = {}): Promise<Message[]> => {
    const response = await axiosInstance.get('/messages', { params });
    return response.data;
  },
};
