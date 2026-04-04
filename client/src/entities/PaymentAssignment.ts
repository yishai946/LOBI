import { Payment } from './Payment';

export type PaymentAssignmentStatus = 'PENDING' | 'PAID';

export interface PaymentAssignment {
  id: string;
  paymentId: string;
  apartmentId: string;
  status: PaymentAssignmentStatus;
  stripeSessionId: string | null;
  proofKey?: string | null;
  proofUploadedAt?: string | null;
  proofApprovedAt?: string | null;
  proofApprovedById?: string | null;
  proofUrl?: string | null;
  paidAt: string | null;
  paidById: string | null;
  createdAt: string;
  payment: Payment;
}
