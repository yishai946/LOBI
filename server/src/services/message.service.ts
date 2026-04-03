import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import { SessionPayload } from "../types/auth";
import { SessionType } from "../enums/sessionType.enum";
import {
  CreateMessageCommand,
  UpdateMessageCommand,
} from "../validators/message.validator";
import { PaginationOptions, SortOrder } from "../utils/pagination";
import { notifyNewMessage } from "./notification.service";

interface MessageQueryOptions {
  isUrgent?: boolean;
  sortByCreatedAt?: SortOrder;
}

const isSameCreatorContext = (
  currentUser: SessionPayload,
  createdById: string,
  createdByContextType: "MANAGER" | "RESIDENT" | "ADMIN" | null,
): boolean => {
  return (
    createdById === currentUser.userId &&
    createdByContextType !== null &&
    createdByContextType === currentUser.sessionType
  );
};

export const createMessage = async (
  currentUser: SessionPayload,
  data: CreateMessageCommand,
) => {
  if (
    currentUser.sessionType !== SessionType.MANAGER &&
    currentUser.sessionType !== SessionType.RESIDENT
  ) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  const canPin = currentUser.sessionType === SessionType.MANAGER;
  if (data.isPinned && !canPin) {
    throw new HttpError("אסור", 403);
  }

  const message = await prisma.message.create({
    data: {
      buildingId: currentUser.buildingId,
      createdById: currentUser.userId,
      createdByContextType: currentUser.sessionType,
      title: data.title,
      content: data.content,
      isUrgent: data.isUrgent ?? false,
      isPinned: canPin ? (data.isPinned ?? false) : false,
    },
  });

  // Fire-and-forget notification
  notifyNewMessage(
    currentUser.buildingId,
    currentUser.userId,
    message.id,
    message.title,
  );

  return message;
};

export const getMessages = async (
  currentUser: SessionPayload,
  pagination: PaginationOptions = {},
  queryOptions: MessageQueryOptions = {},
) => {
  const { limit, skip } = pagination;
  const { isUrgent, sortByCreatedAt = "desc" } = queryOptions;

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.message.findMany({
      where: {
        ...(isUrgent !== undefined ? { isUrgent } : {}),
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: sortByCreatedAt }],
      skip,
      take: limit,
    });
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return prisma.message.findMany({
    where: {
      buildingId: currentUser.buildingId,
      ...(isUrgent !== undefined ? { isUrgent } : {}),
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: sortByCreatedAt }],
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

export const updateMessage = async (
  currentUser: SessionPayload,
  messageId: string,
  data: UpdateMessageCommand,
) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new HttpError("ההודעה לא נמצאה", 404);
  }

  if (currentUser.sessionType === SessionType.ADMIN) {
    if (data.isPinned !== undefined) {
      throw new HttpError("אסור", 403);
    }

    const { isPinned, ...updateData } = data;

    return prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });
  }

  if (
    !currentUser.buildingId ||
    message.buildingId !== currentUser.buildingId
  ) {
    throw new HttpError("אסור", 403);
  }

  if (currentUser.sessionType === SessionType.MANAGER) {
    return prisma.message.update({
      where: { id: messageId },
      data,
    });
  }

  if (currentUser.sessionType === SessionType.RESIDENT) {
    if (
      !isSameCreatorContext(
        currentUser,
        message.createdById,
        message.createdByContextType,
      )
    ) {
      throw new HttpError("אסור", 403);
    }

    if (data.isPinned !== undefined) {
      throw new HttpError("אסור", 403);
    }

    const { isPinned, ...updateData } = data;

    return prisma.message.update({
      where: { id: messageId },
      data: updateData,
    });
  }

  throw new HttpError("אסור", 403);
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

  if (currentUser.sessionType === SessionType.ADMIN) {
    return prisma.message.delete({ where: { id: messageId } });
  }

  if (
    !currentUser.buildingId ||
    message.buildingId !== currentUser.buildingId
  ) {
    throw new HttpError("אסור", 403);
  }

  if (currentUser.sessionType === SessionType.MANAGER) {
    return prisma.message.delete({ where: { id: messageId } });
  }

  if (currentUser.sessionType === SessionType.RESIDENT) {
    if (
      !isSameCreatorContext(
        currentUser,
        message.createdById,
        message.createdByContextType,
      )
    ) {
      throw new HttpError("אסור", 403);
    }

    return prisma.message.delete({ where: { id: messageId } });
  }

  throw new HttpError("אסור", 403);
};
