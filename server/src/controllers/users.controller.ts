import { Request, Response } from "express";
import * as userService from "../services/user.service";

export const createResident = async (req: Request, res: Response) => {
  const resident = await userService.createResident(req.user, req.body);

  return res.status(201).json({
    message: "Resident created successfully",
    resident,
  });
};

export const createManager = async (req: Request, res: Response) => {
  const manager = await userService.createManager(req.body);

  return res.status(201).json({
    message: "Manager created successfully",
    manager,
  });
};
