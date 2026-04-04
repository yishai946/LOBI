import { buildingService } from '@api/buildingService';
import { PaymentFilterParam, paymentService } from '@api/paymentService';
import Banner from '@components/Banner';
import { PaymentAssignmentCard } from '@components/Cards/PaymentAssignmentCard';
import { CardList, Column } from '@components/containers';
import { ContextType } from '@enums/ContextType';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Divider } from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ManagerPaymentsPage } from './ManagerPaymentsPage';
import { UpgradeRequestCard } from './components/UpgradeRequestCard';
import { RecurringSeriesEnrollmentPanel } from './components/RecurringSeriesEnrollmentPanel';

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

const ResidentPaymentsPage = () => {
  const queryClient = useQueryClient();
  const { currentContext } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();

  // State
  const [activeFilter, setActiveFilter] = useState<PaymentFilterParam>('all');
  const [activeSort, setActiveSort] = useState('dueDesc');
  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(3);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasRequestedUpgrade, setHasRequestedUpgrade] = useState(false);

  const isFreeTier = currentContext?.buildingTier === 'FREE';
  const sortParam = activeSort === 'dueAsc' ? 'old' : 'new';

  // Queries
  const { data: allPayments = [], isLoading: isAllPaymentsLoading } = useQuery({
    queryKey: ['payments', 'my', 'list', activeFilter, sortParam],
    queryFn: () =>
      paymentService.getMyPayments({
        filter: activeFilter,
        sort: sortParam,
        limit: 200,
      }),
  });

  const { data: allPendingPayments = [], isLoading: isTotalPaymentLoading } = useQuery({
    queryKey: ['payments', 'my', 'list', 'pending', 'old'],
    queryFn: () =>
      paymentService.getMyPayments({
        filter: 'pending',
        sort: 'old',
        limit: 200,
      }),
  });

  const { data: recurringSeries = [], isLoading: isRecurringSeriesLoading } = useQuery({
    queryKey: ['payments', 'my', 'recurring-series'],
    queryFn: () => paymentService.getMyRecurringSeries(),
  });

  // Mutations
  const { mutate: payAllNow, isPending: isRedirectingToCheckout } = useMutation({
    mutationFn: () => paymentService.createPayAllCheckoutSession(),
    onSuccess: (result) => {
      window.location.href = result.checkoutUrl;
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'לא ניתן ליצור הזמנה לתשלום');
    },
  });

  const { mutate: setEnrollment, isPending: isUpdatingEnrollment } = useMutation({
    mutationFn: ({ seriesId, enabled }: { seriesId: string; enabled: boolean }) =>
      paymentService.setMyRecurringEnrollment(seriesId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'my', 'recurring-series'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'my', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'my', 'list', 'pending', 'old'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'לא ניתן לעדכן הנדון');
    },
  });

  const { mutate: requestUpgrade, isPending: isRequestingUpgrade } = useMutation({
    mutationFn: () => buildingService.requestUpgrade('DIGITAL_PAYMENTS'),
    onSuccess: () => {
      setHasRequestedUpgrade(true);
      showSuccess('בקשת השדרוג נשלחה בהצלחה');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'לא ניתן לשלוח בקשת שדרוג';
      if (error?.response?.status === 429) {
        setHasRequestedUpgrade(true);
      }
      showError(message);
    },
  });

  // Computed values
  const totalPendingAmount = useMemo(
    () =>
      allPendingPayments.reduce(
        (sum, assignment) => sum + Number(assignment.payment.amount || 0),
        0
      ),
    [allPendingPayments]
  );

  const currencyCode = allPendingPayments[0]?.payment.currency || 'ILS';
  const formattedTotalPendingAmount = formatCurrency(totalPendingAmount, currencyCode);
  const start = (activePage - 1) * activePageSize;
  const pagedPayments = allPayments.slice(start, start + activePageSize);

  return (
    <Column>
      <Banner
        title={formattedTotalPendingAmount}
        subtitle='סה"כ לתשלום'
        caption={
          totalPendingAmount > 0
            ? 'אתה יכול ללחוץ על "שלם הכל" כדי לשלם את הכל בדרך בטוחה ומהירה'
            : 'אין לך עדיין כל תשלומים עתידיים.'
        }
        isLoading={isTotalPaymentLoading}
        buttonLabel={isFreeTier ? 'בקש השדרוג' : 'שלם הכל'}
        onButtonClick={
          isFreeTier
            ? () => setIsUpgradeModalOpen(true)
            : totalPendingAmount > 0
              ? payAllNow
              : undefined
        }
        isActionLoading={isRedirectingToCheckout}
      />

      {isFreeTier && (
        <UpgradeRequestCard
          onRequestUpgrade={() => setIsUpgradeModalOpen(true)}
          hasRequested={hasRequestedUpgrade}
          isRequesting={isRequestingUpgrade}
        />
      )}

      <RecurringSeriesEnrollmentPanel
        recurringSeries={recurringSeries}
        isLoading={isRecurringSeriesLoading}
        isUpdating={isUpdatingEnrollment}
        isFreeTier={isFreeTier}
        onEnrollmentChange={(seriesId, enabled) => setEnrollment({ seriesId, enabled })}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />

      <Divider sx={{ mb: 2 }} />

      <CardList
        ItemComponent={PaymentAssignmentCard}
        items={pagedPayments}
        isLoading={isAllPaymentsLoading}
        title="תשלומים"
        emptyMessage="אין לך תשלומים עדיין."
        filterConfig={{
          label: 'סינון',
          value: activeFilter,
          options: [
            { label: 'הכל', value: 'all' },
            { label: 'בהמתנה', value: 'pending' },
            { label: 'שולם', value: 'paid' },
            { label: 'איחור', value: 'overdue' },
            { label: 'קרוב', value: 'upcoming' },
            { label: 'שולם ב-30 יום האחרונים', value: 'recentPaid' },
          ],
          onChange: (value) => {
            setActiveFilter(value as PaymentFilterParam);
            setActivePage(1);
          },
        }}
        sortConfig={{
          label: 'סדר',
          variant: 'direction-toggle',
          value: activeSort,
          ascValue: 'dueAsc',
          descValue: 'dueDesc',
          onChange: (value) => {
            setActiveSort(value);
            setActivePage(1);
          },
        }}
        paginationConfig={{
          page: activePage,
          pageSize: activePageSize,
          totalItems: allPayments.length,
          onPageChange: setActivePage,
          onPageSizeChange: (size) => {
            setActivePageSize(size);
            setActivePage(1);
          },
          pageSizeOptions: [2, 3, 5, 10],
        }}
      />

      <Dialog open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)}>
        <DialogTitle>בקשת שדרוג - תשלומים דיגיטליים</DialogTitle>
        <DialogContent>
          כדי להשתמש בתשלומים דיגיטליים, אנא בקש מהמנהל שלך לשדרג את הבניין ל-Pro. זה יאפשר לך לשלם
          בקלות עם Bit וכרטיס אשראי.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUpgradeModalOpen(false)}>סגור</Button>
          <Button
            variant="contained"
            onClick={() => requestUpgrade()}
            disabled={hasRequestedUpgrade || isRequestingUpgrade}
          >
            {hasRequestedUpgrade ? 'בקשה נשלחה' : 'שלח בקשה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Column>
  );
};

export const PaymentsPage = () => {
  const { currentContext } = useAuth();

  if (currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN) {
    return <ManagerPaymentsPage />;
  }

  return <ResidentPaymentsPage />;
};
