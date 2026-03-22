import { PaymentAssignment } from '@entities/PaymentAssignment';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export type PaymentStatusParam = 'PENDING' | 'PAID';
export type SortParam = 'new' | 'old' | 'asc' | 'desc';
export type PaymentFilterParam = 'all' | 'pending' | 'paid' | 'overdue' | 'upcoming' | 'recentPaid';

export interface PaymentQueryParams extends PaginationParams {
  sort?: SortParam;
  filter?: PaymentFilterParam;
}

const buildApiUrl = (path: string) => {
  const baseUrl = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  return `${baseUrl}${path}`;
};

export const paymentService = {
  getMyPayments: async (params: PaymentQueryParams = {}): Promise<PaymentAssignment[]> => {
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

  createPayAllCheckoutSession: async (): Promise<{
    checkoutUrl: string;
    assignmentsCount: number;
  }> => {
    const response = await axiosInstance.post('/payments/my/checkout-all', {});
    return response.data;
  },

  getReceiptDownloadUrl: (sessionId: string, download = true): string => {
    const searchParams = new URLSearchParams({
      session_id: sessionId,
      ...(download ? { download: '1' } : {}),
    });

    return buildApiUrl(`/payments/public/receipt?${searchParams.toString()}`);
  },
};
