import { Box } from '@mui/material';
import { Typography } from '@mui/material';

import { Card } from '@components/containers';

import { PaymentSummary } from './managerPayments.types';
import { formatCurrency } from './managerPayments.utils';

const PaymentSummaryCard = ({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) => (
  <Card
    sx={{
      minHeight: 130,
      justifyContent: 'space-between',
      bgcolor: 'rgba(255, 255, 255, 0.28)',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
    }}
  >
    <Typography variant="body2" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h5" sx={{ fontWeight: 800 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {hint}
    </Typography>
  </Card>
);

interface ManagerPaymentsSummaryCardsProps {
  summary: PaymentSummary;
  completionRate: number;
}

const ManagerPaymentsSummaryCards = ({
  summary,
  completionRate,
}: ManagerPaymentsSummaryCardsProps) => (
  <Box
    sx={{
      display: 'grid',
      gap: 1.5,
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        lg: 'repeat(4, minmax(0, 1fr))',
      },
    }}
  >
    <PaymentSummaryCard
      title='סה"כ שנגבה'
      value={formatCurrency(summary.collected)}
      hint="נמדד לפי תשלומים ששולמו בפועל"
    />
    <PaymentSummaryCard
      title="יתרה פתוחה"
      value={formatCurrency(summary.outstanding)}
      hint="סכום ממתין מכל הדירות"
    />
    <PaymentSummaryCard
      title="חיובים באיחור"
      value={String(summary.overdueAssignments)}
      hint="מספר שיוכים שטרם שולמו לאחר תאריך יעד"
    />
    <PaymentSummaryCard
      title="השלמת גבייה"
      value={`${completionRate}%`}
      hint={`${summary.paidAssignments}/${summary.totalAssignments} שיוכים שולמו`}
    />
  </Box>
);

export default ManagerPaymentsSummaryCards;
