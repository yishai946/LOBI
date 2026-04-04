import { useState, useCallback } from 'react';
import {
  ManagerRecurringSeries,
  CreateRecurringSeriesPayload,
  UpdateRecurringSeriesPayload,
} from '@api/paymentService';
import { paymentService } from '@api/paymentService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useGlobalMessage } from '@providers/MessageProvider';
import { getErrorMessage } from '../components/manager/managerPayments.utils';
import { RecurringSeriesFormValues } from '../components/manager/managerPayments.types';

interface UseManagerRecurringStateProps {
  buildingId?: string;
  canManage: boolean;
}

export const useManagerRecurringState = ({
  buildingId,
  canManage,
}: UseManagerRecurringStateProps) => {
  const { showError, showSuccess } = useGlobalMessage();
  const queryClient = useQueryClient();

  // State
  const [createRecurringOpen, setCreateRecurringOpen] = useState(false);
  const [editRecurringTarget, setEditRecurringTarget] = useState<ManagerRecurringSeries | null>(
    null
  );
  const [deleteRecurringTarget, setDeleteRecurringTarget] = useState<ManagerRecurringSeries | null>(
    null
  );

  // Forms
  const createRecurringForm = useForm<RecurringSeriesFormValues>({
    defaultValues: {
      title: '',
      description: '',
      amount: '',
      anchorDay: '',
      startsAt: '',
      endsAt: '',
      createInitialPayment: true,
      status: 'ACTIVE',
    },
  });
  const editRecurringForm = useForm<RecurringSeriesFormValues>({
    defaultValues: {
      title: '',
      description: '',
      amount: '',
      anchorDay: '',
      startsAt: '',
      endsAt: '',
      createInitialPayment: true,
      status: 'ACTIVE',
    },
  });

  // Queries
  const { data: recurringSeries = [], isLoading: isRecurringLoading } = useQuery({
    queryKey: ['payments', 'manager', 'recurring', buildingId],
    queryFn: () => paymentService.getRecurringSeriesForManager({ buildingId: buildingId! }),
    enabled: canManage && Boolean(buildingId),
  });

  const invalidateManagerQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['payments', 'manager'] });
  }, [queryClient]);

  // Mutations
  const createRecurringMutation = useMutation({
    mutationFn: (payload: CreateRecurringSeriesPayload) =>
      paymentService.createRecurringSeries(payload),
    onSuccess: () => {
      showSuccess('סדרת חיובים נוצרה בהצלחה');
      createRecurringForm.reset();
      setCreateRecurringOpen(false);
      invalidateManagerQueries();
    },
    onError: (error) => showError(getErrorMessage(error, 'שגיאה ביצירת סדרת חיובים')),
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
      showSuccess('סדרת החיובים עודכנה בהצלחה');
      setEditRecurringTarget(null);
      invalidateManagerQueries();
    },
    onError: (error) => showError(getErrorMessage(error, 'שגיאה בעדכון סדרת חיובים')),
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: (seriesId: string) => paymentService.deleteRecurringSeries(seriesId),
    onSuccess: () => {
      showSuccess('סדרת החיובים נמחקה בהצלחה');
      setDeleteRecurringTarget(null);
      invalidateManagerQueries();
    },
    onError: (error) => showError(getErrorMessage(error, 'שגיאה במחיקת סדרת חיובים')),
  });

  // Computed
  const activeRecurringCount = recurringSeries.filter(
    (series) => series.status === 'ACTIVE'
  ).length;

  return {
    // State
    createRecurringOpen,
    setCreateRecurringOpen,
    editRecurringTarget,
    setEditRecurringTarget,
    deleteRecurringTarget,
    setDeleteRecurringTarget,
    isRecurringLoading,
    // Forms
    createRecurringForm,
    editRecurringForm,
    // Data
    recurringSeries,
    activeRecurringCount,
    // Mutations
    createRecurringMutation,
    updateRecurringMutation,
    deleteRecurringMutation,
  };
};
