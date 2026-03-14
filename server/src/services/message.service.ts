import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";
import { CreateMessageCommand } from "../validators/message.validator";

export const createMessage = async (
  currentUser: SessionPayload,
  data: CreateMessageCommand,
) => {
  if (currentUser.sessionType !== SessionType.MANAGER) {
    throw new HttpError("Forbidden", 403);
  }

  if (!currentUser.buildingId) {
    throw new HttpError("Building context required", 400);
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

export const getMessages = async (currentUser: SessionPayload) => {
  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.message.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  if (!currentUser.buildingId) {
    throw new HttpError("Building context required", 400);
  }

  return prisma.message.findMany({
    where: { buildingId: currentUser.buildingId },
    orderBy: { createdAt: "desc" },
  });
};

export const getMessageById = async (
  currentUser: SessionPayload,
  messageId: string,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new HttpError("Message not found", 404);

  if (currentUser.sessionType === SessionType.ADMIN) return message;

  if (message.buildingId !== currentUser.buildingId) {
    throw new HttpError("Forbidden", 403);
  }

  return message;
};

export const deleteMessage = async (messageId: string) => {
  return prisma.message.delete({ where: { id: messageId } });
};
