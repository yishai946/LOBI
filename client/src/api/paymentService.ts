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

export type RecurringSeriesStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';
export type RecurringEnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'CANCELED';

export interface RecurringEnrollment {
  id: string;
  seriesId: string;
  apartmentId: string;
  residentId: string | null;
  status: RecurringEnrollmentStatus;
  autoPayEnabledAt: string | null;
  nextBillingAt: string | null;
  lastChargedAt: string | null;
}

export interface RecurringSeries {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: RecurringSeriesStatus;
  cadence: 'MONTHLY';
  anchorDay: number;
  startsAt: string;
  endsAt: string | null;
  enrollments: RecurringEnrollment[];
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

  getMyRecurringSeries: async (): Promise<RecurringSeries[]> => {
    const response = await axiosInstance.get('/payments/my/recurring-series');
    return response.data;
  },

  setMyRecurringEnrollment: async (
    seriesId: string,
    enabled: boolean
  ): Promise<{ message: string; enrollment: RecurringEnrollment }> => {
    const response = await axiosInstance.post(
      `/payments/my/recurring-series/${seriesId}/enrollment`,
      {
        enabled,
      }
    );

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
