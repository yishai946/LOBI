import { PaymentAssignment } from '@entities/PaymentAssignment';
import { PaginationParams } from '../types/pagination';
import { axiosInstance } from './axiosInstance';

export type PaymentStatusParam = 'PENDING' | 'PAID';
export type SortParam = 'new' | 'old' | 'asc' | 'desc';
export type PaymentFilterParam = 'all' | 'pending' | 'paid' | 'overdue' | 'upcoming' | 'recentPaid';

export interface PaymentQueryParams extends PaginationParams {
  sort?: SortParam;
  filter?: PaymentFilterParam;
  buildingId?: string;
}

export interface PaymentAssignmentsStats {
  total: number;
  paid: number;
  pending: number;
}

export interface ManagerPayment {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  dueAt: string;
  isRecurring: boolean;
  recurringSeriesId: string | null;
  createdAt: string;
  assignments: PaymentAssignmentsStats;
}

export interface PaymentApartmentSummary {
  id: string;
  name: string;
}

export interface ManagerPaymentAssignment {
  id: string;
  paymentId: string;
  apartmentId: string;
  status: PaymentStatusParam;
  stripeSessionId: string | null;
  paidAt: string | null;
  paidById: string | null;
  createdAt: string;
  apartment: PaymentApartmentSummary;
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
  apartment?: PaymentApartmentSummary;
  resident?: {
    id: string;
    name: string | null;
    phone: string;
  } | null;
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

export interface ManagerRecurringSeries extends RecurringSeries {
  _count: {
    enrollments: number;
  };
}

export interface CreatePaymentPayload {
  title: string;
  description?: string;
  amount: number;
  dueAt: string;
  buildingId: string;
  isRecurring: boolean;
}

export interface UpdatePaymentPayload {
  title?: string;
  description?: string;
  amount?: number;
  dueAt?: string;
  isRecurring?: boolean;
}

export interface CreateRecurringSeriesPayload {
  title: string;
  description?: string;
  amount: number;
  buildingId: string;
  cadence?: 'MONTHLY';
  anchorDay: number;
  startsAt?: string;
  endsAt?: string;
  createInitialPayment?: boolean;
}

export interface UpdateRecurringSeriesPayload {
  title?: string;
  description?: string;
  amount?: number;
  endsAt?: string | null;
  status?: RecurringSeriesStatus;
}

const buildApiUrl = (path: string) => {
  const baseUrl = (import.meta.env.VITE_API_URL as string).replace(/\/$/, '');
  return `${baseUrl}${path}`;
};

export const paymentService = {
  getPayments: async (params: PaymentQueryParams = {}): Promise<ManagerPayment[]> => {
    const response = await axiosInstance.get('/payments', { params });
    return response.data;
  },

  getPaymentAssignments: async (
    paymentId: string,
    params: PaginationParams = {}
  ): Promise<ManagerPaymentAssignment[]> => {
    const response = await axiosInstance.get(`/payments/${paymentId}/assignments`, { params });
    return response.data;
  },

  createPayment: async (payload: CreatePaymentPayload): Promise<ManagerPayment> => {
    const response = await axiosInstance.post('/payments', payload);
    return response.data.payment;
  },

  updatePayment: async (
    paymentId: string,
    payload: UpdatePaymentPayload
  ): Promise<ManagerPayment> => {
    const response = await axiosInstance.patch(`/payments/${paymentId}`, payload);
    return response.data.payment;
  },

  deletePayment: async (paymentId: string): Promise<ManagerPayment> => {
    const response = await axiosInstance.delete(`/payments/${paymentId}`);
    return response.data.payment;
  },

  getRecurringSeriesForManager: async (
    params: { buildingId?: string } = {}
  ): Promise<ManagerRecurringSeries[]> => {
    const response = await axiosInstance.get('/payments/recurring-series', { params });
    return response.data;
  },

  createRecurringSeries: async (
    payload: CreateRecurringSeriesPayload
  ): Promise<ManagerRecurringSeries> => {
    const response = await axiosInstance.post('/payments/recurring-series', payload);
    return response.data.series;
  },

  updateRecurringSeries: async (
    seriesId: string,
    payload: UpdateRecurringSeriesPayload
  ): Promise<ManagerRecurringSeries> => {
    const response = await axiosInstance.patch(`/payments/recurring-series/${seriesId}`, payload);
    return response.data.series;
  },

  deleteRecurringSeries: async (seriesId: string): Promise<ManagerRecurringSeries> => {
    const response = await axiosInstance.delete(`/payments/recurring-series/${seriesId}`);
    return response.data.series;
  },

  getMyPayments: async (params: PaymentQueryParams = {}): Promise<PaymentAssignment[]> => {
    const response = await axiosInstance.get('/payments/my', { params });
    return response.data;
  },

  getMyNextPayment: async (): Promise<PaymentAssignment | null> => {
    const response = await axiosInstance.get('/payments/my/next');
    return response.data;
  },

  createCheckoutSession: async (
    assignmentId: string,
    options?: { isRecurring?: boolean }
  ): Promise<{ checkoutUrl: string }> => {
    const response = await axiosInstance.post(`/payments/${assignmentId}/checkout`, options || {});
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
