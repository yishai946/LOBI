import { paymentService } from '@api/paymentService';
import { Card, Column, Row } from '@components/containers';
import { PaymentAssignment } from '@entities/PaymentAssignment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { Box, Button, Chip, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';

interface PaymentAssignmentCardProps {
  item: PaymentAssignment;
}

const formatAmount = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateValue?: string | null): string => {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('he-IL');
};

export const PaymentAssignmentCard = ({ item }: PaymentAssignmentCardProps) => {
  const isPending = item.status !== 'PAID';
  const dueAtDate = new Date(item.payment.dueAt);
  const hasValidDueDate = !Number.isNaN(dueAtDate.getTime());
  const isOverdue = isPending && hasValidDueDate && dueAtDate.getTime() < Date.now();

  const amountText = formatAmount(item.payment.amount, item.payment.currency || 'ILS');
  const descriptionText = item.payment.description?.trim() || '';
  const dueDateText = formatDate(item.payment.dueAt);
  const paidDateText = formatDate(item.paidAt);
  const statusDateText = isPending
    ? dueDateText
      ? `לתשלום עד: ${dueDateText}`
      : 'ממתין לתשלום'
    : paidDateText
      ? `שולם בתאריך: ${paidDateText}`
      : 'שולם';

  const { mutate: payNow, isPending: isPaying } = useMutation({
    mutationFn: (assignmentId: string) => paymentService.createCheckoutSession(assignmentId),
    onSuccess: (result) => {
      window.location.href = result.checkoutUrl;
    },
  });

  const handleReceiptDownload = () => {
    if (!item.stripeSessionId) {
      return;
    }

    const receiptUrl = paymentService.getReceiptDownloadUrl(item.stripeSessionId);
    window.open(receiptUrl, '_blank', 'noopener,noreferrer');
  };

  console.log(item.payment.description + " " + item.stripeSessionId);

  return (
    <Card isError={isOverdue}>
      <Row sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Row sx={{ alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {item.payment.title}
          </Typography>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCardIcon sx={{ fontSize: 18 }} />
          </Box>
        </Row>
        {isOverdue && (
          <Chip
            label="יש חוב"
            size="small"
            sx={{
              bgcolor: 'error.light',
              color: 'error.main',
              fontWeight: 700,
              borderRadius: 3,
            }}
          />
        )}
      </Row>
      {descriptionText && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {descriptionText}
        </Typography>
      )}
      <Row sx={{ alignItems: 'flex-end', justifyContent: 'space-between', mb: 1 }}>
        <Column>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            יתרה לתשלום
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            {amountText}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusDateText}
          </Typography>
        </Column>
        {isPending ? (
          <Button
            variant="contained"
            disableElevation
            onClick={() => payNow(item.id)}
            disabled={isPaying}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              bgcolor: isOverdue ? 'error.main' : 'primary.dark',
              color: 'primary.contrastText',
              fontWeight: 700,
              '&:hover': {
                bgcolor: 'primary.main',
              },
            }}
          >
            {isPaying ? 'מעביר לתשלום...' : 'לתשלום'}
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<ReceiptLongRoundedIcon />}
            onClick={handleReceiptDownload}
            disabled={!item.stripeSessionId}
            sx={{
              px: 2.5,
              py: 1,
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            {item.stripeSessionId ? 'הורדת קבלה' : 'קבלה לא זמינה'}
          </Button>
        )}
      </Row>
    </Card>
  );
};
