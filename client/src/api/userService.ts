import { UpdateMeRequest, UpdateMeResponse } from '../DTOs/UserDTOs';
import { User } from '../entities/User';
import { axiosInstance } from './axiosInstance';

export const userService = {
  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  updateMe: async (data: UpdateMeRequest): Promise<UpdateMeResponse> => {
    const response = await axiosInstance.patch('/users/me', data);
    return response.data;
  },
};
