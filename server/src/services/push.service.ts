import webpush from 'web-push';
import prisma from '../lib/prisma';
import { NotificationType } from '../../generated/prisma/enums';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@lobi.co.il', // Placeholder email
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const sendPushNotification = async (userId: string, payload: {
  title: string;
  body?: string;
  type: NotificationType;
  referenceId?: string;
  referenceType?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyOnMessages: true,
      notifyOnIssues: true,
      notifyOnPayments: true,
      pushSubscriptions: true,
    },
  });

  if (!user || user.pushSubscriptions.length === 0) return;

  // Check user preferences
  if (payload.type === NotificationType.NEW_MESSAGE && !user.notifyOnMessages) return;
  if (payload.type === NotificationType.ISSUE_STATUS_CHANGED && !user.notifyOnIssues) return;
  if (payload.type === NotificationType.NEW_PAYMENT && !user.notifyOnPayments) return;
  if (payload.type === NotificationType.PAYMENT_REMINDER && !user.notifyOnPayments) return;

  const pushPayload = JSON.stringify(payload);

  const notifications = user.pushSubscriptions.map(async (sub) => {
    try {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      await webpush.sendNotification(subscription, pushPayload);
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription has expired or is no longer valid
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error('Error sending push notification:', error);
      }
    }
  });

  await Promise.all(notifications);
};
