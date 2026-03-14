import { Request, Response } from "express";
import * as managerService from "../services/manager.service";

export const createManager = async (req: Request, res: Response) => {
  const manager = await managerService.createManager(req.body);

  res.status(201).json({
    message: "Manager created successfully",
    manager,
  });
};

export const getManagers = async (_req: Request, res: Response) => {
  const managers = await managerService.getManagers();

  res.json(managers);
};

export const getManagerById = async (req: Request, res: Response) => {
  const manager = await managerService.getManagerById(
    req.params.managerId as string,
  );

  res.json(manager);
};

export const deleteManager = async (req: Request, res: Response) => {
  const manager = await managerService.deleteManager(
    req.params.managerId as string,
  );

  res.json({
    message: "Manager deleted successfully",
    manager,
  });
};
