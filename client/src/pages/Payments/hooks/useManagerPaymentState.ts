import { useState, useMemo, useCallback } from 'react';
import {
  PaymentFilterParam,
  SortParam,
  ManagerPayment,
  CreatePaymentPayload,
  UpdatePaymentPayload,
} from '@api/paymentService';
import { paymentService } from '@api/paymentService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useGlobalMessage } from '@providers/MessageProvider';
import { getErrorMessage } from '../components/manager/managerPayments.utils';
import { PaymentFormValues } from '../components/manager/managerPayments.types';

interface UseManagerPaymentStateProps {
  buildingId?: string;
  canManage: boolean;
  isCreateRoute: boolean;
  onNavigate?: (path: string) => void;
}

export const useManagerPaymentState = ({
  buildingId,
  canManage,
  isCreateRoute,
  onNavigate,
}: UseManagerPaymentStateProps) => {
  const { showError, showSuccess } = useGlobalMessage();
  const queryClient = useQueryClient();

  // State
  const [activeFilter, setActiveFilter] = useState<PaymentFilterParam>('all');
  const [activeSort, setActiveSort] = useState<SortParam>('new');
  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(5);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [editPaymentTarget, setEditPaymentTarget] = useState<ManagerPayment | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<ManagerPayment | null>(null);
  const [assignmentsTarget, setAssignmentsTarget] = useState<ManagerPayment | null>(null);
  const [isLimitedEditPayment, setIsLimitedEditPayment] = useState(false);

  // Forms
  const createPaymentForm = useForm<PaymentFormValues>({
    defaultValues: { title: '', description: '', amount: '', dueAt: '' },
  });
  const editPaymentForm = useForm<PaymentFormValues>({
    defaultValues: { title: '', description: '', amount: '', dueAt: '' },
  });

  // Queries
  const { data: allPayments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments', 'manager', 'list', buildingId, activeFilter, activeSort],
    queryFn: () =>
      paymentService.getPayments({
        buildingId: buildingId!,
        filter: activeFilter,
        sort: activeSort,
        limit: 200,
      }),
    enabled: canManage && Boolean(buildingId),
  });

  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['payments', 'manager', 'assignments', assignmentsTarget?.id],
    queryFn: () => paymentService.getPaymentAssignments(assignmentsTarget!.id, { limit: 250 }),
    enabled: Boolean(assignmentsTarget),
  });

  const invalidateManagerQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['payments', 'manager'] });
  }, [queryClient]);

  // Mutations
  const createPaymentMutation = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentService.createPayment(payload),
    onSuccess: () => {
      showSuccess('החיוב נוצר בהצלחה');
      createPaymentForm.reset();
      setCreatePaymentOpen(false);
      invalidateManagerQueries();
      if (isCreateRoute && onNavigate) onNavigate('/payments');
    },
    onError: (error) => showError(getErrorMessage(error, 'שגיאה ביצירת חיוב')),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: UpdatePaymentPayload }) =>
      paymentService.updatePayment(paymentId, payload),
    onSuccess: () => {
      showSuccess('החיוב עודכן בהצלחה');
      setEditPaymentTarget(null);
      setIsLimitedEditPayment(false);
      invalidateManagerQueries();
    },
    onError: (error) => showError(getErrorMessage(error, 'שגיאה בעדכון חיוב')),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => paymentService.deletePayment(paymentId),
    onSuccess: () => {
      showSuccess('החיוב נמחק בהצלחה');
      setDeletePaymentTarget(null);
      invalidateManagerQueries();
    },
    onError: (error) => showError(getErrorMessage(error, 'שגיאה במחיקת חיוב')),
  });

  // Computed
  const paymentSummary = useMemo(() => {
    const now = Date.now();
    return allPayments.reduce(
      (summary, payment) => {
        const dueAt = new Date(payment.dueAt).getTime();
        summary.collected += payment.amount * payment.assignments.paid;
        summary.outstanding += payment.amount * payment.assignments.pending;
        summary.totalAssignments += payment.assignments.total;
        summary.paidAssignments += payment.assignments.paid;
        if (Number.isFinite(dueAt) && dueAt < now) {
          summary.overdueAssignments += payment.assignments.pending;
        }
        return summary;
      },
      {
        collected: 0,
        outstanding: 0,
        overdueAssignments: 0,
        totalAssignments: 0,
        paidAssignments: 0,
      }
    );
  }, [allPayments]);

  const completionRate =
    paymentSummary.totalAssignments === 0
      ? 0
      : Math.round((paymentSummary.paidAssignments / paymentSummary.totalAssignments) * 100);

  const pagedPayments = allPayments.slice(
    (activePage - 1) * activePageSize,
    activePage * activePageSize
  );

  return {
    // State
    activeFilter,
    setActiveFilter,
    activeSort,
    setActiveSort,
    activePage,
    setActivePage,
    activePageSize,
    setActivePageSize,
    createPaymentOpen,
    setCreatePaymentOpen,
    editPaymentTarget,
    setEditPaymentTarget,
    deletePaymentTarget,
    setDeletePaymentTarget,
    assignmentsTarget,
    setAssignmentsTarget,
    isLimitedEditPayment,
    setIsLimitedEditPayment,
    isPaymentsLoading,
    isAssignmentsLoading,
    // Forms
    createPaymentForm,
    editPaymentForm,
    // Data
    allPayments,
    assignments,
    paymentSummary,
    completionRate,
    pagedPayments,
    // Mutations
    createPaymentMutation,
    updatePaymentMutation,
    deletePaymentMutation,
  };
};
