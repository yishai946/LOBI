import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { parsePaginationQuery } from "../utils/pagination";

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

export const getMe = async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user);

  res.json(user);
};

export const updateMe = async (req: Request, res: Response) => {
  const user = await userService.updateMe(req.user, req.body);

  res.json({
    message: "Profile updated successfully",
    user,
  });
};

export const getUsers = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const users = await userService.getAllUsers(pagination);

  res.json(users);
};

export const getUserById = async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.userId as string);

  res.json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
  const user = await userService.deleteUser(req.params.userId as string);

  res.json({
    message: "User deleted successfully",
    user,
  });
};
