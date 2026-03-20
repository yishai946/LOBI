import { Request, Response } from "express";
import * as apartmentService from "../services/apartment.service";
import { parsePaginationQuery } from "../utils/pagination";

export const createApartment = async (req: Request, res: Response) => {
  const apartment = await apartmentService.create(req.body);

  return res.status(201).json({
    message: "Apartment created successfully",
    apartment,
  });
};

export const getApartments = async (req: Request, res: Response) => {
  const pagination = parsePaginationQuery(req.query);
  const apartments = await apartmentService.getAll(req.user, pagination);

  res.json(apartments);
};

export const getApartmentById = async (req: Request, res: Response) => {
  const apartment = await apartmentService.getById(
    req.user,
    req.params.id as string,
  );

  res.json(apartment);
};

export const updateApartment = async (req: Request, res: Response) => {
  const apartment = await apartmentService.update(
    req.user,
    req.params.id as string,
    req.body,
  );

  res.json({
    message: "Apartment updated successfully",
    apartment,
  });
};

export const deleteApartment = async (req: Request, res: Response) => {
  const apartment = await apartmentService.remove(
    req.user,
    req.params.id as string,
  );

  res.json({
    message: "Apartment deleted successfully",
    apartment,
  });
};
