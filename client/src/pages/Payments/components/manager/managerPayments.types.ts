import { RecurringSeriesStatus } from '@api/paymentService';

export type ManagerTab = 'oneTime' | 'recurring';

export type AssignmentFilter = 'all' | 'paid' | 'pending';

export interface PaymentFormValues {
  title: string;
  description: string;
  amount: string;
  dueAt: string;
}

export interface RecurringSeriesFormValues {
  title: string;
  description: string;
  amount: string;
  anchorDay: string;
  startsAt: string;
  endsAt: string;
  createInitialPayment: boolean;
  status: RecurringSeriesStatus;
}

export interface PaymentSummary {
  collected: number;
  outstanding: number;
  overdueAssignments: number;
  totalAssignments: number;
  paidAssignments: number;
}
