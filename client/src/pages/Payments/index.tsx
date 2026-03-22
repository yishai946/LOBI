import { PaymentFilterParam, RecurringSeries, paymentService } from '@api/paymentService';
import Banner from '@components/Banner';
import { PaymentAssignmentCard } from '@components/Cards/PaymentAssignmentCard';
import { CardList, Column } from '@components/containers';
import { Box, Button, Chip, Divider, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<PaymentFilterParam>('all');
  const [activeSort, setActiveSort] = useState('dueDesc');
  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(3);

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
  });

  const { mutate: setEnrollment, isPending: isUpdatingEnrollment } = useMutation({
    mutationFn: ({ seriesId, enabled }: { seriesId: string; enabled: boolean }) =>
      paymentService.setMyRecurringEnrollment(seriesId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'my', 'recurring-series'] });
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

  return (
    <Column>
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
          תשלומים קבועים
        </Typography>
        <Typography variant="body2" color="text.secondary">
          הפעל חיוב אוטומטי פעם אחת, והמערכת תטפל בהמשך התשלומים החודשיים עבורך.
        </Typography>

        {isRecurringSeriesLoading ? (
          <Typography variant="body2" color="text.secondary">
            טוען סדרות חיוב...
          </Typography>
        ) : recurringSeries.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            אין כרגע סדרות חיוב קבועות זמינות עבורך.
          </Typography>
        ) : (
          <Column sx={{ gap: 1 }}>
            {recurringSeries.map((series) => {
              const enrollment = getEnrollment(series);
              const isActive = enrollment?.status === 'ACTIVE';

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
                        label={isActive ? 'חיוב אוטומטי פעיל' : 'חיוב אוטומטי כבוי'}
                        color={isActive ? 'success' : 'default'}
                      />
                    </Box>

                    {series.description && (
                      <Typography variant="body2" color="text.secondary">
                        {series.description}
                      </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      תאריך חיוב חודשי: יום {series.anchorDay}
                    </Typography>

                    <Button
                      variant={isActive ? 'outlined' : 'contained'}
                      onClick={() => setEnrollment({ seriesId: series.id, enabled: !isActive })}
                      disabled={isUpdatingEnrollment || series.status === 'ENDED'}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {isActive ? 'כבה חיוב אוטומטי' : 'הפעל חיוב אוטומטי'}
                    </Button>
                  </Column>
                </Box>
              );
            })}
          </Column>
        )}
      </Column>

      <Divider sx={{ mb: 2 }} />

      <Banner
        title={formattedTotalPendingAmount}
        subtitle='סה"כ הכל לתשלום'
        caption={
          totalPendingAmount > 0
            ? 'לחץ על כפתור "שלם עכשיו" כדי לשלם את כל התשלומים הממתינים'
            : 'אין תשלומים ממתינים לתשלום.'
        }
        isLoading={isTotalPaymentLoading}
        buttonLabel="שלם עכשיו"
        onButtonClick={totalPendingAmount > 0 ? payAllNow : undefined}
        isActionLoading={isRedirectingToCheckout}
      />

      <CardList
        ItemComponent={PaymentAssignmentCard}
        items={pagedPayments}
        isLoading={isAllPaymentsLoading}
        title="תשלומים"
        emptyMessage="אין תשלומים להצגה."
        filterConfig={{
          label: 'סינון',
          value: activeFilter,
          options: [
            { label: 'הכל', value: 'all' },
            { label: 'ממתינים', value: 'pending' },
            { label: 'שולמו', value: 'paid' },
            { label: 'באיחור', value: 'overdue' },
            { label: 'עתידיים', value: 'upcoming' },
            { label: 'שולמו ב-30 ימים אחרונים', value: 'recentPaid' },
          ],
          onChange: (value) => {
            setActiveFilter(value as PaymentFilterParam);
            setActivePage(1);
          },
        }}
        sortConfig={{
          label: 'מיון',
          value: activeSort,
          options: [
            { label: 'חדש', value: 'dueDesc' },
            { label: 'ישן', value: 'dueAsc' },
          ],
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
    </Column>
  );
};
