import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildingService } from '@api/buildingService';
import Banner from '@components/Banner';
import { Card, Column } from '@components/containers';
import { ContextType } from '@enums/ContextType';
import { Button, Typography } from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ManagerAssignmentsDrawer from './components/manager/ManagerAssignmentsDrawer';
import ManagerOneTimePaymentsPanel from './components/manager/ManagerOneTimePaymentsPanel';
import ManagerPaymentDialogs from './components/manager/ManagerPaymentDialogs';
import ManagerPaymentsSummaryCards from './components/manager/ManagerPaymentsSummaryCards';
import ManagerPaymentsTabsToolbar from './components/manager/ManagerPaymentsTabsToolbar';
import ManagerRecurringDialogs from './components/manager/ManagerRecurringDialogs';
import ManagerRecurringSeriesPanel from './components/manager/ManagerRecurringSeriesPanel';
import { ManagerTab } from './components/manager/managerPayments.types';
import { toDateInputValue, getErrorMessage } from './components/manager/managerPayments.utils';
import { useManagerPaymentState } from './hooks/useManagerPaymentState';
import { useManagerRecurringState } from './hooks/useManagerRecurringState';

export const ManagerPaymentsPage = () => {
  const { currentContext } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canManage =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN;
  const buildingId = currentContext?.buildingId;
  const isFreeTier = currentContext?.buildingTier === 'FREE';
  const isCreateRoute = location.pathname === '/payments/new';

  const [activeTab, setActiveTab] = useState<ManagerTab>('oneTime');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Payment state
  const paymentState = useManagerPaymentState({
    buildingId,
    canManage,
    isCreateRoute,
    onNavigate: navigate,
  });

  // Recurring state
  const recurringState = useManagerRecurringState({
    buildingId,
    canManage,
  });

  // Upgrade summary query
  const { data: upgradeSummary } = useQuery({
    queryKey: ['upgrade-requests', 'summary', buildingId],
    queryFn: () => buildingService.getUpgradeRequestSummary(buildingId!),
    enabled: isFreeTier && Boolean(buildingId),
  });

  // Auto-open create dialog on /payments/new route
  useEffect(() => {
    if (isCreateRoute && canManage) {
      paymentState.setCreatePaymentOpen(true);
    }
  }, [isCreateRoute, canManage]);

  // Update edit form when target changes
  useEffect(() => {
    if (!paymentState.editPaymentTarget) return;
    paymentState.setIsLimitedEditPayment(paymentState.editPaymentTarget.assignments.paid > 0);
    paymentState.editPaymentForm.reset({
      title: paymentState.editPaymentTarget.title,
      description: paymentState.editPaymentTarget.description || '',
      amount: String(paymentState.editPaymentTarget.amount),
      dueAt: toDateInputValue(paymentState.editPaymentTarget.dueAt),
    });
  }, [paymentState.editPaymentTarget]);

  // Update recurring edit form when target changes
  useEffect(() => {
    if (!recurringState.editRecurringTarget) return;
    recurringState.editRecurringForm.reset({
      title: recurringState.editRecurringTarget.title,
      description: recurringState.editRecurringTarget.description || '',
      amount: String(recurringState.editRecurringTarget.amount),
      anchorDay: String(recurringState.editRecurringTarget.anchorDay),
      startsAt: toDateInputValue(recurringState.editRecurringTarget.startsAt),
      endsAt: toDateInputValue(recurringState.editRecurringTarget.endsAt),
      createInitialPayment: true,
      status: recurringState.editRecurringTarget.status,
    });
  }, [recurringState.editRecurringTarget]);

  // Filter assignments
  const filteredAssignments =
    assignmentFilter === 'all'
      ? paymentState.assignments
      : paymentState.assignments.filter(
          (item) => item.status === (assignmentFilter === 'paid' ? 'PAID' : 'PENDING')
        );

  // Form handlers
  const handleSubmitCreatePayment = paymentState.createPaymentForm.handleSubmit((values) => {
    if (!buildingId) return; // Already checked in query enabled
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    paymentState.createPaymentMutation.mutate({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      amount,
      dueAt: new Date(values.dueAt).toISOString(),
      buildingId,
      isRecurring: false,
    });
  });

  const handleSubmitEditPayment = paymentState.editPaymentForm.handleSubmit((values) => {
    if (!paymentState.editPaymentTarget) return;

    const payload: any = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      dueAt: new Date(values.dueAt).toISOString(),
    };

    if (!paymentState.isLimitedEditPayment) {
      const amount = Number(values.amount);
      if (!Number.isFinite(amount) || amount <= 0) return;
      payload.amount = amount;
    }

    paymentState.updatePaymentMutation.mutate({
      paymentId: paymentState.editPaymentTarget.id,
      payload,
    });
  });

  const handleSubmitCreateRecurring = recurringState.createRecurringForm.handleSubmit((values) => {
    if (!buildingId) return;
    const amount = Number(values.amount);
    const anchorDay = Number(values.anchorDay);

    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!Number.isInteger(anchorDay) || anchorDay < 1 || anchorDay > 28) return;

    recurringState.createRecurringMutation.mutate({
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

  const handleSubmitEditRecurring = recurringState.editRecurringForm.handleSubmit((values) => {
    if (!recurringState.editRecurringTarget) return;
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    recurringState.updateRecurringMutation.mutate({
      seriesId: recurringState.editRecurringTarget.id,
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
        subtitle={`${paymentState.allPayments.length} חיובים, ${recurringState.recurringSeries.length} סדרות`}
        buttonLabel="חיוב חדש"
        onButtonClick={() => paymentState.setCreatePaymentOpen(true)}
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

      <ManagerPaymentsSummaryCards
        summary={paymentState.paymentSummary}
        completionRate={paymentState.completionRate}
      />

      <Card>
        <ManagerPaymentsTabsToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreatePayment={() => paymentState.setCreatePaymentOpen(true)}
          onCreateRecurring={() => recurringState.setCreateRecurringOpen(true)}
        />
        {activeTab === 'oneTime' ? (
          <ManagerOneTimePaymentsPanel
            activeFilter={paymentState.activeFilter}
            activeSort={paymentState.activeSort}
            activePageSize={paymentState.activePageSize}
            activePage={paymentState.activePage}
            allPaymentsLength={paymentState.allPayments.length}
            isLoading={paymentState.isPaymentsLoading}
            pagedPayments={paymentState.pagedPayments}
            onFilterChange={(value) => {
              paymentState.setActiveFilter(value);
              paymentState.setActivePage(1);
            }}
            onSortChange={(value) => {
              paymentState.setActiveSort(value);
              paymentState.setActivePage(1);
            }}
            onPageSizeChange={(value) => {
              paymentState.setActivePageSize(value);
              paymentState.setActivePage(1);
            }}
            onPageChange={paymentState.setActivePage}
            onOpenAssignments={(payment) => {
              paymentState.setAssignmentsTarget(payment);
              setAssignmentFilter('all');
            }}
            onEdit={paymentState.setEditPaymentTarget}
            onDelete={paymentState.setDeletePaymentTarget}
          />
        ) : (
          <ManagerRecurringSeriesPanel
            recurringSeries={recurringState.recurringSeries}
            activeRecurringCount={recurringState.activeRecurringCount}
            isLoading={recurringState.isRecurringLoading}
            onEdit={recurringState.setEditRecurringTarget}
            onDelete={recurringState.setDeleteRecurringTarget}
          />
        )}
      </Card>

      <ManagerAssignmentsDrawer
        assignmentsTarget={paymentState.assignmentsTarget}
        assignmentFilter={assignmentFilter}
        isAssignmentsLoading={paymentState.isAssignmentsLoading}
        filteredAssignments={filteredAssignments}
        onClose={() => paymentState.setAssignmentsTarget(null)}
        onFilterChange={setAssignmentFilter}
      />

      <ManagerPaymentDialogs
        createOpen={paymentState.createPaymentOpen}
        editTarget={paymentState.editPaymentTarget}
        deleteTarget={paymentState.deletePaymentTarget}
        createForm={paymentState.createPaymentForm}
        editForm={paymentState.editPaymentForm}
        isLimitedEditPayment={paymentState.isLimitedEditPayment}
        isCreateSubmitting={paymentState.createPaymentMutation.isPending}
        isEditSubmitting={paymentState.updatePaymentMutation.isPending}
        isDeleteSubmitting={paymentState.deletePaymentMutation.isPending}
        onCloseCreate={() => {
          if (paymentState.createPaymentMutation.isPending) return;
          paymentState.createPaymentForm.reset();
          paymentState.setCreatePaymentOpen(false);
          if (isCreateRoute) navigate('/payments', { replace: true });
        }}
        onSubmitCreate={handleSubmitCreatePayment}
        onCloseEdit={() => {
          if (paymentState.updatePaymentMutation.isPending) return;
          paymentState.setEditPaymentTarget(null);
          paymentState.setIsLimitedEditPayment(false);
        }}
        onSubmitEdit={handleSubmitEditPayment}
        onCancelDelete={() => {
          if (!paymentState.deletePaymentMutation.isPending)
            paymentState.setDeletePaymentTarget(null);
        }}
        onConfirmDelete={() => {
          if (
            paymentState.deletePaymentTarget &&
            paymentState.deletePaymentTarget.assignments.paid === 0
          ) {
            paymentState.deletePaymentMutation.mutate(paymentState.deletePaymentTarget.id);
          }
        }}
      />

      <ManagerRecurringDialogs
        createOpen={recurringState.createRecurringOpen}
        editTarget={recurringState.editRecurringTarget}
        deleteTarget={recurringState.deleteRecurringTarget}
        createForm={recurringState.createRecurringForm}
        editForm={recurringState.editRecurringForm}
        isCreateSubmitting={recurringState.createRecurringMutation.isPending}
        isEditSubmitting={recurringState.updateRecurringMutation.isPending}
        isDeleteSubmitting={recurringState.deleteRecurringMutation.isPending}
        onCloseCreate={() => {
          if (recurringState.createRecurringMutation.isPending) return;
          recurringState.createRecurringForm.reset();
          recurringState.setCreateRecurringOpen(false);
        }}
        onSubmitCreate={handleSubmitCreateRecurring}
        onCloseEdit={() => {
          if (!recurringState.updateRecurringMutation.isPending)
            recurringState.setEditRecurringTarget(null);
        }}
        onSubmitEdit={handleSubmitEditRecurring}
        onCancelDelete={() => {
          if (!recurringState.deleteRecurringMutation.isPending)
            recurringState.setDeleteRecurringTarget(null);
        }}
        onConfirmDelete={() => {
          if (recurringState.deleteRecurringTarget)
            recurringState.deleteRecurringMutation.mutate(recurringState.deleteRecurringTarget.id);
        }}
      />
    </Column>
  );
};
