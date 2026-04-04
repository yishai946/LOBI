import { useCallback } from 'react';
import {
  CreatePaymentPayload,
  CreateRecurringSeriesPayload,
  paymentService,
  UpdatePaymentPayload,
  UpdateRecurringSeriesPayload,
} from '@api/paymentService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@utils/errorHandling';

interface UsePaymentMutationsOptions {
  onSuccessCreatePayment?: () => void;
  onSuccessUpdatePayment?: () => void;
  onSuccessDeletePayment?: () => void;
  onSuccessCreateRecurring?: () => void;
  onSuccessUpdateRecurring?: () => void;
  onSuccessDeleteRecurring?: () => void;
  onError?: (error: unknown, message: string) => void;
  onSuccess?: (message: string) => void;
}

/**
 * Hook for managing payment and recurring series CRUD mutations
 * Handles all payment-related API calls with consistent error/success handling
 */
export const usePaymentMutations = (callbacks?: UsePaymentMutationsOptions) => {
  const queryClient = useQueryClient();

  const invalidateManagerQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['payments', 'manager'] });
  }, [queryClient]);

  const createPaymentMutation = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentService.createPayment(payload),
    onSuccess: () => {
      callbacks?.onSuccess?.('החיוב נוצר בהצלחה');
      invalidateManagerQueries();
      callbacks?.onSuccessCreatePayment?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה ביצירת חיוב');
      callbacks?.onError?.(error, message);
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: UpdatePaymentPayload }) =>
      paymentService.updatePayment(paymentId, payload),
    onSuccess: () => {
      callbacks?.onSuccess?.('החיוב עודכן בהצלחה');
      invalidateManagerQueries();
      callbacks?.onSuccessUpdatePayment?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה בעדכון חיוב');
      callbacks?.onError?.(error, message);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => paymentService.deletePayment(paymentId),
    onSuccess: () => {
      callbacks?.onSuccess?.('החיוב נמחק בהצלחה');
      invalidateManagerQueries();
      callbacks?.onSuccessDeletePayment?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה במחיקת חיוב');
      callbacks?.onError?.(error, message);
    },
  });

  const createRecurringMutation = useMutation({
    mutationFn: (payload: CreateRecurringSeriesPayload) =>
      paymentService.createRecurringSeries(payload),
    onSuccess: () => {
      callbacks?.onSuccess?.('סדרת חיובים נוצרה בהצלחה');
      invalidateManagerQueries();
      callbacks?.onSuccessCreateRecurring?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה ביצירת סדרת חיובים');
      callbacks?.onError?.(error, message);
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: ({
      seriesId,
      payload,
    }: {
      seriesId: string;
      payload: UpdateRecurringSeriesPayload;
    }) => paymentService.updateRecurringSeries(seriesId, payload),
    onSuccess: () => {
      callbacks?.onSuccess?.('סדרת החיובים עודכנה בהצלחה');
      invalidateManagerQueries();
      callbacks?.onSuccessUpdateRecurring?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה בעדכון סדרת חיובים');
      callbacks?.onError?.(error, message);
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (seriesId: string) => paymentService.deleteRecurringSeries(seriesId),
    onSuccess: () => {
      callbacks?.onSuccess?.('סדרת החיובים נמחקה בהצלחה');
      invalidateManagerQueries();
      callbacks?.onSuccessDeleteRecurring?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה במחיקת סדרת חיובים');
      callbacks?.onError?.(error, message);
    },
  });

  return {
    createPaymentMutation,
    updatePaymentMutation,
    deletePaymentMutation,
    createRecurringMutation,
    updateRecurringMutation,
    deleteRecurringMutation,
  };
};
