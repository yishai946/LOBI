import { paymentService } from '@api/paymentService';
import { Card, Column, Row } from '@components/containers';
import { PaymentAssignment } from '@entities/PaymentAssignment';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { Box, Button, Chip, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useRef } from 'react';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';

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
  const queryClient = useQueryClient();
  const { currentContext } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isFreeTier = currentContext?.buildingTier === 'FREE';
  const isPending = item.status !== 'PAID';
  const isDone = item.status === 'PAID';
  const dueAtDate = new Date(item.payment.dueAt);
  const hasValidDueDate = !Number.isNaN(dueAtDate.getTime());
  const isOverdue = isPending && hasValidDueDate && dueAtDate.getTime() < Date.now();

  const amountText = formatAmount(item.payment.amount, item.payment.currency || 'ILS');
  const descriptionText = item.payment.description?.trim() || '';
  const isRecurring = Boolean(item.payment.isRecurring);
  const dueDateText = formatDate(item.payment.dueAt);
  const paidDateText = formatDate(item.paidAt);
  const hasProof = Boolean(item.proofKey);
  const hasApprovedProof = Boolean(item.proofApprovedAt);
  const isAwaitingProofApproval = isPending && isFreeTier && hasProof && !hasApprovedProof;
  const doneWithProof = isDone && isFreeTier && hasApprovedProof;
  const statusDateText = isPending
    ? isAwaitingProofApproval
      ? 'ממתין לאישור'
      : dueDateText
        ? `תשלום עד: ${dueDateText}`
        : 'אין תאריך'
    : dueDateText
      ? `תשלום עד: ${dueDateText}`
      : paidDateText
        ? `תאריך תשלום: ${paidDateText}`
        : 'לא זמין';
  const statusChipLabel = isDone
    ? doneWithProof
      ? 'שולם ואושר'
      : 'שולם'
    : isAwaitingProofApproval
      ? 'ממתין לאישור'
      : 'ממתין לתשלום';
  const statusChipColor = isDone ? 'success' : isAwaitingProofApproval ? 'warning' : 'default';
  const statusChipIcon = isDone ? (
    <CheckCircleRoundedIcon />
  ) : isAwaitingProofApproval ? (
    <HourglassTopRoundedIcon />
  ) : (
    <PendingActionsRoundedIcon />
  );

  const { mutate: payNow, isPending: isPaying } = useMutation({
    mutationFn: ({ assignmentId, isRecurring }: { assignmentId: string; isRecurring?: boolean }) =>
      paymentService.createCheckoutSession(assignmentId, { isRecurring }),
    onSuccess: (result) => {
      window.location.href = result.checkoutUrl;
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'לא ניתן ליצור הזמנה');
    },
  });

  const { mutate: uploadProof, isPending: isUploadingProof } = useMutation({
    mutationFn: ({ assignmentId, file }: { assignmentId: string; file: File }) =>
      paymentService.uploadPaymentProof(assignmentId, file),
    onSuccess: () => {
      showSuccess('הוכחה הועלתה בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'לא ניתן להעלות הוכחה');
    },
  });

  const handleReceiptDownload = () => {
    if (!item.stripeSessionId) {
      return;
    }

    const receiptUrl = paymentService.getReceiptDownloadUrl(item.stripeSessionId);
    window.open(receiptUrl, '_blank', 'noopener,noreferrer');
  };

  const handleProofUploadClick = () => {
    if (!isPending || !isFreeTier) return;
    fileInputRef.current?.click();
  };

  const handleProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadProof({ assignmentId: item.id, file });
    event.target.value = '';
  };

  const handleProofView = () => {
    if (item.proofUrl) {
      window.open(item.proofUrl, '_blank', 'noopener,noreferrer');
    }
  };

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
        <Row sx={{ alignItems: 'center', gap: 1 }}>
          {isRecurring && (
            <Chip
              label="תשלום חוזר"
              size="small"
              sx={{
                bgcolor: 'success.light',
                color: 'success.main',
                fontWeight: 700,
                borderRadius: 3,
              }}
            />
          )}
          <Chip
            size="small"
            color={statusChipColor}
            icon={statusChipIcon}
            label={statusChipLabel}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
            }}
          />
          {isOverdue && (
            <Chip
              label="איחור"
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
      </Row>
      {descriptionText && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {descriptionText}
        </Typography>
      )}
      <Row sx={{ alignItems: 'flex-end', justifyContent: 'space-between', mb: 1 }}>
        <Column>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            סכום תשלום
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            {amountText}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusDateText}
          </Typography>
        </Column>
        {isPending ? (
          isFreeTier ? (
            <Column sx={{ gap: 1, alignItems: 'stretch' }}>
              <Button
                variant="contained"
                disableElevation
                onClick={handleProofUploadClick}
                disabled={isUploadingProof}
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: isOverdue ? 'error.main' : 'primary.dark',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                }}
                startIcon={<UploadFileRoundedIcon />}
              >
                {isUploadingProof ? 'בעיבוד...' : hasProof ? 'החלף הוכחה' : 'העלה הוכחה'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleProofView}
                disabled={!item.proofUrl}
                startIcon={<VisibilityRoundedIcon />}
                sx={{ px: 2, py: 0.75, borderRadius: 2, fontWeight: 700 }}
              >
                {item.proofUrl ? 'צפה בהוכחה' : 'הוכחה לא זמינה'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleProofFileChange}
              />
            </Column>
          ) : isRecurring ? (
            <Column sx={{ gap: 1, alignItems: 'stretch' }}>
              <Button
                variant="contained"
                disableElevation
                onClick={() => payNow({ assignmentId: item.id, isRecurring: false })}
                disabled={isPaying}
                sx={{
                  px: 2.5,
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
                {isPaying ? 'בעיבוד...' : 'תשלום חד-פעמי'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => payNow({ assignmentId: item.id, isRecurring: true })}
                disabled={isPaying}
                sx={{ px: 2, py: 0.75, borderRadius: 2, fontWeight: 700 }}
              >
                {isPaying ? 'בעיבוד...' : 'המשך כמנוי'}
              </Button>
            </Column>
          ) : (
            <Button
              variant="contained"
              disableElevation
              onClick={() => payNow({ assignmentId: item.id })}
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
              {isPaying ? 'בעיבוד...' : 'תשלום'}
            </Button>
          )
        ) : doneWithProof ? (
          <Button
            variant="outlined"
            startIcon={<VisibilityRoundedIcon />}
            onClick={handleProofView}
            disabled={!item.proofUrl}
            sx={{
              px: 2.5,
              py: 1,
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            {item.proofUrl ? 'צפה בהוכחה' : 'הוכחה לא זמינה'}
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
            {item.stripeSessionId ? 'הורד קבלה' : 'קבלה לא זמינה'}
          </Button>
        )}
      </Row>
    </Card>
  );
};
