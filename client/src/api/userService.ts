import { UpdateMeRequest, UpdateMeResponse } from '../DTOs/UserDTOs';
import { User } from '../entities/User';
import { axiosInstance } from './axiosInstance';

export interface CreateResidentByPhonePayload {
  phone: string;
  apartmentId: string;
}

export const userService = {
  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  updateMe: async (data: UpdateMeRequest): Promise<UpdateMeResponse> => {
    const response = await axiosInstance.patch('/users/me', data);
    return response.data;
  },

  createResidentByPhone: async (payload: CreateResidentByPhonePayload): Promise<User> => {
    const response = await axiosInstance.post('/users/resident', payload);
    return response.data.resident;
  },
};
