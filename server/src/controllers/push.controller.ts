import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { SessionPayload } from '../types/auth';

export const subscribeToPush = async (req: Request, res: Response) => {
  const currentUser = (req as any).user as SessionPayload;
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: currentUser.userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      userId: currentUser.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  res.status(204).send();
};

export const unsubscribeFromPush = async (req: Request, res: Response) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint required' });
  }

  await prisma.pushSubscription.delete({
    where: { endpoint },
  });

  res.status(204).send();
};

export const getNotificationSettings = async (req: Request, res: Response) => {
  const currentUser = (req as any).user as SessionPayload;

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: {
      notifyOnMessages: true,
      notifyOnIssues: true,
      notifyOnPayments: true,
    },
  });

  res.json(user);
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  const currentUser = (req as any).user as SessionPayload;
  const { notifyOnMessages, notifyOnIssues, notifyOnPayments } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: currentUser.userId },
    data: {
      notifyOnMessages,
      notifyOnIssues,
      notifyOnPayments,
    },
    select: {
      notifyOnMessages: true,
      notifyOnIssues: true,
      notifyOnPayments: true,
    },
  });

  res.json(updatedUser);
};
