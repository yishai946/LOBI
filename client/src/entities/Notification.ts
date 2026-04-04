export type NotificationType =
  | 'NEW_MESSAGE'
  | 'ISSUE_STATUS_CHANGED'
  | 'NEW_PAYMENT'
  | 'PAYMENT_REMINDER'
  | 'UPGRADE_REQUEST';

export interface Notification {
  id: string;
  userId: string;
  buildingId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  isRead: boolean;
  referenceId?: string | null;
  referenceType?: string | null;
  createdAt: string;
  readAt?: string | null;
}
