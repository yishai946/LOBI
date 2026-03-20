import { Request, Response } from "express";
import * as residentService from "../services/resident.service";
import { parsePaginationQuery } from "../utils/pagination";

export const createResident = async (req: Request, res: Response) => {
  const resident = await residentService.createResident(req.user, req.body);

  res.status(201).json({
    message: "Resident created successfully",
    resident,
  });
};

export const getResidents = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const residents = await residentService.getResidents(req.user, pagination);

  res.json(residents);
};

export const getResidentById = async (req: Request, res: Response) => {
  const resident = await residentService.getResidentById(
    req.user,
    req.params.residentId as string,
  );

  res.json(resident);
};

export const updateResident = async (req: Request, res: Response) => {
  const resident = await residentService.updateResident(
    req.user,
    req.params.residentId as string,
    req.body,
  );

  res.json({
    message: "Resident updated successfully",
    resident,
  });
};

export const deleteResident = async (req: Request, res: Response) => {
  const resident = await residentService.deleteResident(
    req.user,
    req.params.residentId as string,
  );

  res.json({
    message: "Resident deleted successfully",
    resident,
  });
};
