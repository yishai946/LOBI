import { Request, Response } from "express";
import * as upgradeRequestService from "../services/upgradeRequest.service";

export const createUpgradeRequest = async (req: Request, res: Response) => {
  const result = await upgradeRequestService.createUpgradeRequest(req.user, req.body);

  res.status(201).json(result);
};

export const getUpgradeRequestSummary = async (req: Request, res: Response) => {
  const buildingId = req.params.buildingId as string | undefined;
  const summary = await upgradeRequestService.getUpgradeRequestSummary(req.user, buildingId);

  res.json(summary);
};
