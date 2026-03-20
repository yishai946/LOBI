import { Request, Response } from "express";
import * as managerService from "../services/manager.service";
import { parsePaginationQuery } from "../utils/pagination";

export const createManager = async (req: Request, res: Response) => {
  const manager = await managerService.createManager(req.body);

  res.status(201).json({
    message: "Manager created successfully",
    manager,
  });
};

export const getManagers = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const managers = await managerService.getManagers(pagination);

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
