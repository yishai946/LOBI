import { User } from '@entities/User';
import {
  CompleteProfileRequest,
  MessageResponse,
  RequestOtpRequest,
  SelectContextRequest,
  SelectContextResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../DTOs/AuthDTOs';
import { axiosInstance } from './axiosInstance';

export const authService = {
  requestOtp: async (data: RequestOtpRequest): Promise<MessageResponse> => {
    const response = await axiosInstance.post('/auth/request-otp', data);
    return response.data;
  },

  resendOtp: async (data: RequestOtpRequest): Promise<MessageResponse> => {
    const response = await axiosInstance.post('/auth/resend-otp', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const response = await axiosInstance.post('/auth/verify-otp', data);
    return response.data;
  },

  completeProfile: async (
    data: CompleteProfileRequest
  ): Promise<{ message: string; user: User }> => {
    const response = await axiosInstance.post('/auth/complete-profile', data);
    return response.data;
  },

  selectContext: async (data: SelectContextRequest): Promise<SelectContextResponse> => {
    const response = await axiosInstance.post('/auth/select-context', data);
    return response.data;
  },
};
