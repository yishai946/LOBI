import { ManagerPayment } from '@api/paymentService';
import { getErrorMessage } from '@utils/errorHandling';

export { getErrorMessage };

export const formatCurrency = (amount: number, currency = 'ILS'): string =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return 'לא זמין';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'לא זמין';
  }

  return date.toLocaleDateString('he-IL');
};

export const toDateInputValue = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

export const getPaymentCardTone = (payment: ManagerPayment): 'default' | 'warning' | 'success' => {
  const now = Date.now();
  const dueAt = new Date(payment.dueAt).getTime();

  if (payment.assignments.pending === 0) {
    return 'success';
  }

  if (Number.isFinite(dueAt) && dueAt < now) {
    return 'warning';
  }

  return 'default';
};
