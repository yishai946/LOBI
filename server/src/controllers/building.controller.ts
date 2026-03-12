import { Request, Response } from "express";
import * as buildingService from "../services/building.service";

export const createBuilding = async (req: Request, res: Response) => {
  const building = await buildingService.create(req.body);

  return res.status(201).json({
    message: "Building created successfully",
    building,
  });
};

export const getAllBuildings = async (req: Request, res: Response) => {
  const buildings = await buildingService.getAll();
  
  res.json(buildings);
};

export const getBuildingById = async (req: Request, res: Response) => {
  const building = await buildingService.getById(req.params.id as string);
  
  if (!building) {
    return res.status(404).json({ message: "Building not found" });
  }

  res.json(building);
}