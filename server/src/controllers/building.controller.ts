import { Request, Response } from "express";
import * as buildingService from "../services/building.service";
import { parsePaginationQuery } from "../utils/pagination";
import { SessionPayload } from "../types/auth";

export const createBuilding = async (req: Request, res: Response) => {
  const currentUser = req.user as SessionPayload;
  const building = await buildingService.create(req.body);

  return res.status(201).json({
    message: "Building created successfully",
    building,
  });
};

export const getAllBuildings = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const buildings = await buildingService.getAll(pagination);

  res.json(buildings);
};

export const getBuildingById = async (req: Request, res: Response) => {
  const building = await buildingService.getById(req.params.id as string);

  if (!building) {
    return res.status(404).json({ message: "Building not found" });
  }

  res.json(building);
};

export const updateBuilding = async (req: Request, res: Response) => {
  const building = await buildingService.update(
    req.params.id as string,
    req.body,
  );

  res.json({
    message: "Building updated successfully",
    building,
  });
};

export const deleteBuilding = async (req: Request, res: Response) => {
  const building = await buildingService.remove(req.params.id as string);

  res.json({
    message: "Building deleted successfully",
    building,
  });
};
