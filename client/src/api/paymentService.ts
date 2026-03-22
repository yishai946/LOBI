import { PaymentAssignment } from '@entities/PaymentAssignment';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export const paymentService = {
  getMyPayments: async (params: PaginationParams = {}): Promise<PaymentAssignment[]> => {
    const response = await axiosInstance.get('/payments/my', { params });
    return response.data;
  },

  getMyNextPayment: async (): Promise<PaymentAssignment | null> => {
    const response = await axiosInstance.get('/payments/my/next');
    return response.data;
  },

  createCheckoutSession: async (assignmentId: string): Promise<{ checkoutUrl: string }> => {
    const response = await axiosInstance.post(`/payments/${assignmentId}/checkout`, {});
    return response.data;
  },
};
