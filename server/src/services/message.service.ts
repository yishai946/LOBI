import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";
import { CreateMessageCommand } from "../validators/message.validator";
import { PaginationOptions } from "../utils/pagination";

export const createMessage = async (
  currentUser: SessionPayload,
  data: CreateMessageCommand,
) => {
  if (currentUser.sessionType !== SessionType.MANAGER) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return prisma.message.create({
    data: {
      buildingId: currentUser.buildingId,
      title: data.title,
      content: data.content,
      isUrgent: data.isUrgent ?? false,
    },
  });
};

export const getMessages = async (
  currentUser: SessionPayload,
  pagination: PaginationOptions = {},
) => {
  const { limit, skip } = pagination;

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return prisma.message.findMany({
    where: { buildingId: currentUser.buildingId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
};

export const getMessageById = async (
  currentUser: SessionPayload,
  messageId: string,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new HttpError("ההודעה לא נמצאה", 404);

  if (currentUser.sessionType === SessionType.ADMIN) return message;

  if (message.buildingId !== currentUser.buildingId) {
    throw new HttpError("אסור", 403);
  }

  return message;
};

export const deleteMessage = async (
  currentUser: SessionPayload,
  messageId: string,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new HttpError("ההודעה לא נמצאה", 404);
  }

  if (currentUser.sessionType !== SessionType.ADMIN) {
    if (
      !currentUser.buildingId ||
      message.buildingId !== currentUser.buildingId
    ) {
      throw new HttpError("אסור", 403);
    }
  }

  return prisma.message.delete({ where: { id: messageId } });
};
