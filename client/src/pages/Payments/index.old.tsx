import { buildingService } from '@api/buildingService';
import { PaymentFilterParam, RecurringSeries, paymentService } from '@api/paymentService';
import Banner from '@components/Banner';
import { PaymentAssignmentCard } from '@components/Cards/PaymentAssignmentCard';
import { CardList, Column, Row } from '@components/containers';
import { ContextType } from '@enums/ContextType';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import {
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ManagerPaymentsPage } from './ManagerPaymentsPage';

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
  const [activeFilter, setActiveFilter] = useState<PaymentFilterParam>('all');
  const [activeSort, setActiveSort] = useState('dueDesc');
  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(3);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasRequestedUpgrade, setHasRequestedUpgrade] = useState(false);

  const isFreeTier = currentContext?.buildingTier === 'FREE';
  const sortParam = activeSort === 'dueAsc' ? 'old' : 'new';

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

  const getEnrollment = (series: RecurringSeries) => series.enrollments?.[0] || null;

  const totalPendingAmount = useMemo(
    () =>
      allPendingPayments.reduce(
        (sum, assignment) => sum + Number(assignment.payment.amount || 0),
        0
      ),
    [allPendingPayments]
  );

  const currencyCode = allPendingPayments[0]?.payment.currency || 'ILS';

  const start = (activePage - 1) * activePageSize;
  const pagedPayments = allPayments.slice(start, start + activePageSize);
  const formattedTotalPendingAmount = formatCurrency(totalPendingAmount, currencyCode);

  const handleUpgradeRequest = () => {
    if (hasRequestedUpgrade) return;
    requestUpgrade();
  };

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
        <Box
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: 3,
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.65) 0%, rgba(248,250,252,0.85) 100%)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Row sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Column sx={{ gap: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                תשלומים אוטומטיים
              </Typography>
            </Column>
            <Row sx={{ gap: 1, alignItems: 'center' }}>
              <PaymentsRoundedIcon sx={{ color: 'text.primary' }} />
              <LockRoundedIcon sx={{ color: 'text.secondary' }} />
            </Row>
          </Row>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              כדי להצליח בתשלומים בחינמי בשלב זה, השתמש בהעברה בנקאית או בקבלה.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setIsUpgradeModalOpen(true)}
              disabled={hasRequestedUpgrade}
              sx={{ mt: 1.5, fontWeight: 700 }}
            >
              {hasRequestedUpgrade ? 'בקשה נשלחה' : 'בקש השדרוג'}
            </Button>
          </Box>
        </Box>
      )}

      <Column
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          gap: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          תשלומים חוזרים
        </Typography>
        <Typography variant="body2" color="text.secondary">
          כאן תוכל לנהל את תשלומיך החוזרים, להצטרף כמנוי או לבטל בכל עת.
        </Typography>

        {isRecurringSeriesLoading ? (
          <Typography variant="body2" color="text.secondary">
            טוען תשלומים...
          </Typography>
        ) : recurringSeries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            אין לך עדיין שום תשלום חוזר פעיל.
          </Typography>
        ) : (
          <Column sx={{ gap: 1 }}>
            {recurringSeries.map((series) => {
              const enrollment = getEnrollment(series);
              const isActive = enrollment?.status === 'ACTIVE';
              const nextBillingText = enrollment?.nextBillingAt
                ? new Date(enrollment.nextBillingAt).toLocaleDateString('he-IL')
                : null;
              const lastChargedText = enrollment?.lastChargedAt
                ? new Date(enrollment.lastChargedAt).toLocaleDateString('he-IL')
                : null;

              return (
                <Box
                  key={series.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  <Column sx={{ gap: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {series.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={isActive ? 'מנוי פעיל כעת' : 'מנוי לא פעיל כעת'}
                        color={isActive ? 'success' : 'default'}
                      />
                    </Box>

                    {series.description && (
                      <Typography variant="body2" color="text.secondary">
                        {series.description}
                      </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      תאריך תשלום: יום {series.anchorDay}
                    </Typography>

                    {nextBillingText && (
                      <Typography variant="body2" color="text.secondary">
                        התשלום הבא: {nextBillingText}
                      </Typography>
                    )}

                    {lastChargedText && (
                      <Typography variant="body2" color="text.secondary">
                        התשלום האחרון: {lastChargedText}
                      </Typography>
                    )}

                    <Button
                      variant={isActive ? 'outlined' : 'contained'}
                      onClick={() =>
                        isFreeTier
                          ? setIsUpgradeModalOpen(true)
                          : setEnrollment({ seriesId: series.id, enabled: !isActive })
                      }
                      disabled={isUpdatingEnrollment || series.status === 'ENDED' || isFreeTier}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {isFreeTier ? 'בקש ל-Pro כעת' : isActive ? 'בטל כמנוי' : 'צרף כמנוי'}
                    </Button>
                  </Column>
                </Box>
              );
            })}
          </Column>
        )}
      </Column>

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
        <DialogTitle>בקש השדרוג ל-Pro</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            בעזרת השדרוג ל-Pro תוכל להנות מתשלומים דיגיטליים בעזרת Bit וכרטיסי אשראי.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsUpgradeModalOpen(false)}>סגור</Button>
          <Button
            variant="contained"
            onClick={handleUpgradeRequest}
            disabled={hasRequestedUpgrade || isRequestingUpgrade}
          >
            {hasRequestedUpgrade ? 'בקשה נשלחה' : 'בקש כעת'}
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
