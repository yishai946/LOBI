import { PaymentFilterParam, paymentService } from '@api/paymentService';
import Banner from '@components/Banner';
import { PaymentAssignmentCard } from '@components/Cards/PaymentAssignmentCard';
import { CardList, Column } from '@components/containers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export const PaymentsPage = () => {
  const [activeFilter, setActiveFilter] = useState<PaymentFilterParam>('all');
  const [activeSort, setActiveSort] = useState('dueAsc');
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

  const { mutate: payAllNow, isPending: isRedirectingToCheckout } = useMutation({
    mutationFn: () => paymentService.createPayAllCheckoutSession(),
    onSuccess: (result) => {
      window.location.href = result.checkoutUrl;
    },
  });

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
      {(totalPendingAmount > 0 || isTotalPaymentLoading) && (
        <Banner
          title={formattedTotalPendingAmount}
          subtitle='סה"כ הכל לתשלום'
          isLoading={isTotalPaymentLoading}
          buttonLabel="שלם עכשיו"
          onButtonClick={payAllNow}
          isActionLoading={isRedirectingToCheckout}
        />
      )}

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
