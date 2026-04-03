import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";
import { parsePaginationQuery } from "../utils/pagination";

export const getNotifications = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const notifications = await notificationService.getNotifications(
    req.user,
    pagination,
  );

  res.json(notifications);
};

export const getUnreadCount = async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user);

  res.json({ count });
};

export const markAsRead = async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(
    req.user,
    req.params.notificationId as string,
  );

  res.json({
    message: "Notification marked as read",
    data: notification,
  });
};

export const markAllAsRead = async (req: Request, res: Response) => {
  const result = await notificationService.markAllAsRead(req.user);

  res.json({
    message: "All notifications marked as read",
    data: result,
  });
};
