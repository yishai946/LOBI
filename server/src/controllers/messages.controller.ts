import { Request, Response } from "express";
import * as messageService from "../services/message.service";
import {
  parseBooleanQueryParam,
  parsePaginationQuery,
  parseSortOrderQuery,
} from "../utils/pagination";

export const createMessage = async (req: Request, res: Response) => {
  const message = await messageService.createMessage(req.user, req.body);

  res.status(201).json({
    message: "Message created successfully",
    data: message,
  });
};

export const getMessages = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const isUrgent = parseBooleanQueryParam(req.query.isUrgent, "isUrgent");
  const sort = parseSortOrderQuery(req.query.sort);
  const messages = await messageService.getMessages(req.user, pagination, {
    isUrgent,
    sortByCreatedAt: sort,
  });

  res.json(messages);
};

export const getMessageById = async (req: Request, res: Response) => {
  const message = await messageService.getMessageById(
    req.user,
    req.params.messageId as string,
  );

  res.json(message);
};

export const deleteMessage = async (req: Request, res: Response) => {
  const message = await messageService.deleteMessage(
    req.user,
    req.params.messageId as string,
  );

  res.json({
    message: "Message deleted successfully",
    data: message,
  });
};
