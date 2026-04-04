import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { PaginationOptions } from "../utils/pagination";
import { NotificationType } from "../../generated/prisma/enums";
import { sendPushNotification } from "./push.service";
import { emitToUser } from "./socket.service";

interface CreateNotificationData {
  userId: string;
  buildingId: string;
  type: NotificationType;
  title: string;
  body?: string;
  referenceId?: string;
  referenceType?: string;
}

/**
 * Create a single notification for a user.
 * Silently swallows errors so that notification creation
 * never breaks the primary business flow.
 */
export const createNotification = async (
  data: CreateNotificationData,
): Promise<void> => {
  try {
    await prisma.notification.create({ data });
    // Trigger push notification
    sendPushNotification(data.userId, {
      title: data.title,
      body: data.body,
      type: data.type,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
    }).catch(() => {}); // Fire and forget

    // Trigger Socket.io real-time update
    emitToUser(data.userId, "NEW_NOTIFICATION", {
      type: data.type,
      title: data.title,
    });
  } catch {
    // Notification creation should never block the primary operation
  }
};

/**
 * Create notifications for multiple users at once.
 * Uses createMany for efficiency.
 */
export const createBulkNotifications = async (
  items: CreateNotificationData[],
): Promise<void> => {
  if (items.length === 0) return;

  try {
    await prisma.notification.createMany({ data: items });
    // Trigger push notifications
    items.forEach((item) => {
      sendPushNotification(item.userId, {
        title: item.title,
        body: item.body,
        type: item.type,
        referenceId: item.referenceId,
        referenceType: item.referenceType,
      }).catch(() => {}); // Fire and forget

      // Trigger Socket.io real-time updates
      emitToUser(item.userId, "NEW_NOTIFICATION", {
        type: item.type,
        title: item.title,
      });
    });
  } catch {
    // Notification creation should never block the primary operation
  }
};

const createInAppNotification = async (
  data: CreateNotificationData,
): Promise<void> => {
  try {
    await prisma.notification.create({ data });
    emitToUser(data.userId, "NEW_NOTIFICATION", {
      type: data.type,
      title: data.title,
    });
  } catch {
    // Notification creation should never block the primary operation
  }
};

export const upsertDailyUpgradeRequestNotifications = async (
  buildingId: string,
  totalRequests: number,
) => {
  const managers = await prisma.manager.findMany({
    where: { buildingId },
    select: { userId: true },
  });

  if (managers.length === 0) return;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const title = `‏${totalRequests} דיירים ביקשו תשלום דיגיטלי`;
  const body = "שדרגו ל-Pro כדי לאפשר Bit וכרטיסי אשראי.";

  await Promise.all(
    managers.map(async (manager) => {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: manager.userId,
          buildingId,
          type: NotificationType.UPGRADE_REQUEST,
          createdAt: { gte: todayStart },
        },
      });

      if (existing) {
        await prisma.notification.update({
          where: { id: existing.id },
          data: { title, body },
        });
        return;
      }

      await createInAppNotification({
        userId: manager.userId,
        buildingId,
        type: NotificationType.UPGRADE_REQUEST,
        title,
        body,
        referenceType: "upgrade",
      });
    }),
  );
};

/**
 * Get paginated notifications for the authenticated user.
 */
export const getNotifications = async (
  currentUser: SessionPayload,
  pagination: PaginationOptions = {},
) => {
  const { limit = 20, skip } = pagination;

  return prisma.notification.findMany({
    where: { userId: currentUser.userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
};

/**
 * Get the total number of unread notifications for the authenticated user.
 */
export const getUnreadCount = async (
  currentUser: SessionPayload,
): Promise<number> => {
  return prisma.notification.count({
    where: {
      userId: currentUser.userId,
      isRead: false,
    },
  });
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (
  currentUser: SessionPayload,
  notificationId: string,
) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new HttpError("ההתראה לא נמצאה", 404);
  }

  if (notification.userId !== currentUser.userId) {
    throw new HttpError("אסור", 403);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

/**
 * Mark all notifications as read for the authenticated user.
 */
export const markAllAsRead = async (
  currentUser: SessionPayload,
) => {
  return prisma.notification.updateMany({
    where: {
      userId: currentUser.userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

// ─── Notification trigger helpers ───────────────────────────────────

/**
 * Notify all residents + managers in a building about a new message,
 * excluding the creator.
 */
export const notifyNewMessage = async (
  buildingId: string,
  creatorId: string,
  messageId: string,
  messageTitle: string,
) => {
  const [residents, managers] = await Promise.all([
    prisma.resident.findMany({
      where: { apartment: { buildingId } },
      select: { userId: true },
    }),
    prisma.manager.findMany({
      where: { buildingId },
      select: { userId: true },
    }),
  ]);

  const userIdSet = new Set<string>();
  for (const r of residents) userIdSet.add(r.userId);
  for (const m of managers) userIdSet.add(m.userId);
  userIdSet.delete(creatorId);

  const items: CreateNotificationData[] = Array.from(userIdSet).map(
    (userId) => ({
      userId,
      buildingId,
      type: NotificationType.NEW_MESSAGE,
      title: `הודעה חדשה: ${messageTitle}`,
      referenceId: messageId,
      referenceType: "message",
    }),
  );

  await createBulkNotifications(items);
};

/**
 * Notify all residents + managers in a building about a new issue,
 * excluding the creator.
 */
export const notifyNewIssue = async (
  buildingId: string,
  creatorId: string,
  issueId: string,
  issueTitle: string,
) => {
  const [residents, managers] = await Promise.all([
    prisma.resident.findMany({
      where: { apartment: { buildingId } },
      select: { userId: true },
    }),
    prisma.manager.findMany({
      where: { buildingId },
      select: { userId: true },
    }),
  ]);

  const userIdSet = new Set<string>();
  for (const r of residents) userIdSet.add(r.userId);
  for (const m of managers) userIdSet.add(m.userId);
  userIdSet.delete(creatorId);

  const items: CreateNotificationData[] = Array.from(userIdSet).map(
    (userId) => ({
      userId,
      buildingId,
      type: NotificationType.ISSUE_STATUS_CHANGED, // Reusing status change for now or can use a new type if exists
      title: `תקלה חדשה דווחה: ${issueTitle}`,
      referenceId: issueId,
      referenceType: "issue",
    }),
  );

  await createBulkNotifications(items);
};

/**
 * Notify relevant users when an issue status changes.
 * - Notify the issue creator (if they're not the one who changed it).
 * - Notify building managers (if a resident changed it).
 */
export const notifyIssueStatusChanged = async (
  buildingId: string,
  changerUserId: string,
  issueCreatorId: string,
  issueId: string,
  issueTitle: string,
  newStatus: string,
) => {
  const statusLabels: Record<string, string> = {
    open: "פתוח",
    inProgress: "בטיפול",
    done: "טופל",
  };

  const statusLabel = statusLabels[newStatus] ?? newStatus;
  const title = `סטטוס תקלה עודכן: ${issueTitle} → ${statusLabel}`;

  // Get all residents and managers in the building
  const [residents, managers] = await Promise.all([
    prisma.resident.findMany({
      where: { apartment: { buildingId } },
      select: { userId: true },
    }),
    prisma.manager.findMany({
      where: { buildingId },
      select: { userId: true },
    }),
  ]);

  const userIdSet = new Set<string>();
  for (const r of residents) userIdSet.add(r.userId);
  for (const m of managers) userIdSet.add(m.userId);
  userIdSet.delete(changerUserId);

  const items: CreateNotificationData[] = Array.from(userIdSet).map(
    (userId) => ({
      userId,
      buildingId,
      type: NotificationType.ISSUE_STATUS_CHANGED,
      title,
      referenceId: issueId,
      referenceType: "issue",
    }),
  );

  await createBulkNotifications(items);
};

/**
 * Notify residents that a new payment has been created for their apartments.
 */
export const notifyNewPayment = async (
  buildingId: string,
  paymentId: string,
  paymentTitle: string,
) => {
  const residents = await prisma.resident.findMany({
    where: { apartment: { buildingId } },
    select: { userId: true },
  });

  const userIdSet = new Set<string>();
  for (const r of residents) userIdSet.add(r.userId);

  const items: CreateNotificationData[] = Array.from(userIdSet).map(
    (userId) => ({
      userId,
      buildingId,
      type: NotificationType.NEW_PAYMENT,
      title: `תשלום חדש: ${paymentTitle}`,
      referenceId: paymentId,
      referenceType: "payment",
    }),
  );

  await createBulkNotifications(items);
};
