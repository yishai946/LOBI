import {
  CreatePaymentPayload,
  CreateRecurringSeriesPayload,
  ManagerPayment,
  ManagerRecurringSeries,
  paymentService,
  PaymentFilterParam,
  SortParam,
  UpdatePaymentPayload,
  UpdateRecurringSeriesPayload,
} from '@api/paymentService';
import { buildingService } from '@api/buildingService';
import Banner from '@components/Banner';
import { Card, Column } from '@components/containers';
import { ContextType } from '@enums/ContextType';
import { Button, Typography } from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagerAssignmentsDrawer from './components/manager/ManagerAssignmentsDrawer';
import ManagerOneTimePaymentsPanel from './components/manager/ManagerOneTimePaymentsPanel';
import ManagerPaymentDialogs from './components/manager/ManagerPaymentDialogs';
import ManagerPaymentsSummaryCards from './components/manager/ManagerPaymentsSummaryCards';
import ManagerPaymentsTabsToolbar from './components/manager/ManagerPaymentsTabsToolbar';
import ManagerRecurringDialogs from './components/manager/ManagerRecurringDialogs';
import ManagerRecurringSeriesPanel from './components/manager/ManagerRecurringSeriesPanel';
import {
  AssignmentFilter,
  ManagerTab,
  PaymentFormValues,
  RecurringSeriesFormValues,
} from './components/manager/managerPayments.types';
import { getErrorMessage, toDateInputValue } from './components/manager/managerPayments.utils';

export const ManagerPaymentsPage = () => {
  const { currentContext } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const canManage =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN;
  const buildingId = currentContext?.buildingId;
  const isFreeTier = currentContext?.buildingTier === 'FREE';
  const isCreateRoute = location.pathname === '/payments/new';

  const [activeTab, setActiveTab] = useState<ManagerTab>('oneTime');
  const [activeFilter, setActiveFilter] = useState<PaymentFilterParam>('all');
  const [activeSort, setActiveSort] = useState<SortParam>('new');
  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(5);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [editPaymentTarget, setEditPaymentTarget] = useState<ManagerPayment | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<ManagerPayment | null>(null);
  const [assignmentsTarget, setAssignmentsTarget] = useState<ManagerPayment | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
  const [createRecurringOpen, setCreateRecurringOpen] = useState(false);
  const [editRecurringTarget, setEditRecurringTarget] = useState<ManagerRecurringSeries | null>(
    null
  );
  const [deleteRecurringTarget, setDeleteRecurringTarget] = useState<ManagerRecurringSeries | null>(
    null
  );
  const [isLimitedEditPayment, setIsLimitedEditPayment] = useState(false);

  const { data: allPayments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments', 'manager', 'list', buildingId, activeFilter, activeSort],
    queryFn: () =>
      paymentService.getPayments({
        buildingId,
        filter: activeFilter,
        sort: activeSort,
        limit: 200,
      }),
    enabled: canManage && Boolean(buildingId),
  });

  const { data: recurringSeries = [], isLoading: isRecurringLoading } = useQuery({
    queryKey: ['payments', 'manager', 'recurring', buildingId],
    queryFn: () => paymentService.getRecurringSeriesForManager({ buildingId }),
    enabled: canManage && Boolean(buildingId),
  });

  const { data: upgradeSummary } = useQuery({
    queryKey: ['upgrade-requests', 'summary', buildingId],
    queryFn: () => buildingService.getUpgradeRequestSummary(buildingId!),
    enabled: isFreeTier && Boolean(buildingId),
  });

  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['payments', 'manager', 'assignments', assignmentsTarget?.id],
    queryFn: () => paymentService.getPaymentAssignments(assignmentsTarget!.id, { limit: 250 }),
    enabled: Boolean(assignmentsTarget),
  });

  const createPaymentForm = useForm<PaymentFormValues>({
    defaultValues: { title: '', description: '', amount: '', dueAt: '' },
  });
  const editPaymentForm = useForm<PaymentFormValues>({
    defaultValues: { title: '', description: '', amount: '', dueAt: '' },
  });
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

  useEffect(() => {
    if (isCreateRoute && canManage) setCreatePaymentOpen(true);
  }, [isCreateRoute, canManage]);

  useEffect(() => {
    if (!editPaymentTarget) return;
    setIsLimitedEditPayment(editPaymentTarget.assignments.paid > 0);
    editPaymentForm.reset({
      title: editPaymentTarget.title,
      description: editPaymentTarget.description || '',
      amount: String(editPaymentTarget.amount),
      dueAt: toDateInputValue(editPaymentTarget.dueAt),
    });
  }, [editPaymentTarget, editPaymentForm]);

  useEffect(() => {
    if (!editRecurringTarget) return;
    editRecurringForm.reset({
      title: editRecurringTarget.title,
      description: editRecurringTarget.description || '',
      amount: String(editRecurringTarget.amount),
      anchorDay: String(editRecurringTarget.anchorDay),
      startsAt: toDateInputValue(editRecurringTarget.startsAt),
      endsAt: toDateInputValue(editRecurringTarget.endsAt),
      createInitialPayment: true,
      status: editRecurringTarget.status,
    });
  }, [editRecurringTarget, editRecurringForm]);

  const invalidateManagerQueries = () =>
    queryClient.invalidateQueries({ queryKey: ['payments', 'manager'] });

  const createPaymentMutation = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentService.createPayment(payload),
    onSuccess: () => {
      showSuccess('החיוב נוצר בהצלחה');
      createPaymentForm.reset();
      setCreatePaymentOpen(false);
      invalidateManagerQueries();
      if (isCreateRoute) navigate('/payments', { replace: true });
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

  const activeRecurringCount = recurringSeries.filter(
    (series) => series.status === 'ACTIVE'
  ).length;

  const pagedPayments = allPayments.slice(
    (activePage - 1) * activePageSize,
    activePage * activePageSize
  );

  const filteredAssignments = useMemo(
    () =>
      assignmentFilter === 'all'
        ? assignments
        : assignments.filter(
            (item) => item.status === (assignmentFilter === 'paid' ? 'PAID' : 'PENDING')
          ),
    [assignments, assignmentFilter]
  );

  const onSubmitCreatePayment = createPaymentForm.handleSubmit((values) => {
    if (!buildingId) return showError('לא נמצא מזהה בניין להקשר הנוכחי');
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) return showError('יש להזין סכום גדול מ-0');

    createPaymentMutation.mutate({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      amount,
      dueAt: new Date(values.dueAt).toISOString(),
      buildingId,
      isRecurring: false,
    });
  });

  const onSubmitEditPayment = editPaymentForm.handleSubmit((values) => {
    if (!editPaymentTarget) return;

    const payload: UpdatePaymentPayload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      dueAt: new Date(values.dueAt).toISOString(),
    };

    if (!isLimitedEditPayment) {
      const amount = Number(values.amount);
      if (!Number.isFinite(amount) || amount <= 0) return showError('יש להזין סכום גדול מ-0');
      payload.amount = amount;
    }

    updatePaymentMutation.mutate({ paymentId: editPaymentTarget.id, payload });
  });

  const onSubmitCreateRecurring = createRecurringForm.handleSubmit((values) => {
    if (!buildingId) return showError('לא נמצא מזהה בניין להקשר הנוכחי');
    const amount = Number(values.amount);
    const anchorDay = Number(values.anchorDay);

    if (!Number.isFinite(amount) || amount <= 0) return showError('יש להזין סכום גדול מ-0');
    if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 28) {
      return showError('יום העיגון חייב להיות בין 1 ל-28');
    }

    createRecurringMutation.mutate({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      amount,
      buildingId,
      cadence: 'MONTHLY',
      anchorDay,
      createInitialPayment: values.createInitialPayment,
      startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
      endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
    });
  });

  const onSubmitEditRecurring = editRecurringForm.handleSubmit((values) => {
    if (!editRecurringTarget) return;
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) return showError('יש להזין סכום גדול מ-0');

    updateRecurringMutation.mutate({
      seriesId: editRecurringTarget.id,
      payload: {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        amount,
        status: values.status,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      },
    });
  });

  if (!canManage) return null;

  if (!buildingId) {
    return (
      <Column gap={2}>
        <Banner
          title="ניהול תשלומים"
          subtitle="נדרש הקשר בניין"
          caption="כדי לנהל חיובים יש לבחור הקשר מנהל עם בניין פעיל."
          buttonLabel="בחירת ההקשר"
          onButtonClick={() => navigate('/select-context')}
        />
      </Column>
    );
  }

  return (
    <Column gap={3}>
      <Banner
        title="ניהול תשלומים"
        subtitle={`${allPayments.length} חיובים, ${recurringSeries.length} סדרות`}
        buttonLabel="חיוב חדש"
        onButtonClick={() => setCreatePaymentOpen(true)}
      />

      {isFreeTier && (
        <Card>
          <Column sx={{ gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              תשלומים דיגיטליים נעולים
            </Typography>
            <Typography variant="body2" color="text.secondary">
              דיירים יכולים לבקש Bit/כרטיס אשראי. שדרגו ל-Pro כדי לאפשר תשלום אוטומטי.
            </Typography>
            {upgradeSummary?.totalRequests ? (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {upgradeSummary.totalRequests} דיירים כבר ביקשו תשלום דיגיטלי.
              </Typography>
            ) : null}
            <Button
              variant="contained"
              onClick={() => navigate('/upgrade')}
              sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
            >
              שדרגו ל-Pro
            </Button>
          </Column>
        </Card>
      )}

      <ManagerPaymentsSummaryCards summary={paymentSummary} completionRate={completionRate} />

      <Card>
        <ManagerPaymentsTabsToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreatePayment={() => setCreatePaymentOpen(true)}
          onCreateRecurring={() => setCreateRecurringOpen(true)}
        />
        {activeTab === 'oneTime' ? (
          <ManagerOneTimePaymentsPanel
            activeFilter={activeFilter}
            activeSort={activeSort}
            activePageSize={activePageSize}
            activePage={activePage}
            allPaymentsLength={allPayments.length}
            isLoading={isPaymentsLoading}
            pagedPayments={pagedPayments}
            onFilterChange={(value) => {
              setActiveFilter(value);
              setActivePage(1);
            }}
            onSortChange={(value) => {
              setActiveSort(value);
              setActivePage(1);
            }}
            onPageSizeChange={(value) => {
              setActivePageSize(value);
              setActivePage(1);
            }}
            onPageChange={setActivePage}
            onOpenAssignments={(payment) => {
              setAssignmentsTarget(payment);
              setAssignmentFilter('all');
            }}
            onEdit={setEditPaymentTarget}
            onDelete={setDeletePaymentTarget}
          />
        ) : (
          <ManagerRecurringSeriesPanel
            recurringSeries={recurringSeries}
            activeRecurringCount={activeRecurringCount}
            isLoading={isRecurringLoading}
            onEdit={setEditRecurringTarget}
            onDelete={setDeleteRecurringTarget}
          />
        )}
      </Card>

      <ManagerAssignmentsDrawer
        assignmentsTarget={assignmentsTarget}
        assignmentFilter={assignmentFilter}
        isAssignmentsLoading={isAssignmentsLoading}
        filteredAssignments={filteredAssignments}
        onClose={() => setAssignmentsTarget(null)}
        onFilterChange={setAssignmentFilter}
      />

      <ManagerPaymentDialogs
        createOpen={createPaymentOpen}
        editTarget={editPaymentTarget}
        deleteTarget={deletePaymentTarget}
        createForm={createPaymentForm}
        editForm={editPaymentForm}
        isLimitedEditPayment={isLimitedEditPayment}
        isCreateSubmitting={createPaymentMutation.isPending}
        isEditSubmitting={updatePaymentMutation.isPending}
        isDeleteSubmitting={deletePaymentMutation.isPending}
        onCloseCreate={() => {
          if (createPaymentMutation.isPending) return;
          createPaymentForm.reset();
          setCreatePaymentOpen(false);
          if (isCreateRoute) navigate('/payments', { replace: true });
        }}
        onSubmitCreate={onSubmitCreatePayment}
        onCloseEdit={() => {
          if (updatePaymentMutation.isPending) return;
          setEditPaymentTarget(null);
          setIsLimitedEditPayment(false);
        }}
        onSubmitEdit={onSubmitEditPayment}
        onCancelDelete={() => {
          if (!deletePaymentMutation.isPending) setDeletePaymentTarget(null);
        }}
        onConfirmDelete={() => {
          if (deletePaymentTarget && deletePaymentTarget.assignments.paid === 0) {
            deletePaymentMutation.mutate(deletePaymentTarget.id);
          }
        }}
      />

      <ManagerRecurringDialogs
        createOpen={createRecurringOpen}
        editTarget={editRecurringTarget}
        deleteTarget={deleteRecurringTarget}
        createForm={createRecurringForm}
        editForm={editRecurringForm}
        isCreateSubmitting={createRecurringMutation.isPending}
        isEditSubmitting={updateRecurringMutation.isPending}
        isDeleteSubmitting={deleteRecurringMutation.isPending}
        onCloseCreate={() => {
          if (createRecurringMutation.isPending) return;
          createRecurringForm.reset();
          setCreateRecurringOpen(false);
        }}
        onSubmitCreate={onSubmitCreateRecurring}
        onCloseEdit={() => {
          if (!updateRecurringMutation.isPending) setEditRecurringTarget(null);
        }}
        onSubmitEdit={onSubmitEditRecurring}
        onCancelDelete={() => {
          if (!deleteRecurringMutation.isPending) setDeleteRecurringTarget(null);
        }}
        onConfirmDelete={() => {
          if (deleteRecurringTarget) deleteRecurringMutation.mutate(deleteRecurringTarget.id);
        }}
      />
    </Column>
  );
};
