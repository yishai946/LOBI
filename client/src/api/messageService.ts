import { Message } from '@entities/Message';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export const messageService = {
  getMessages: async (params: PaginationParams = {}): Promise<Message[]> => {
    const response = await axiosInstance.get('/messages', { params });
    return response.data;
  },
};
