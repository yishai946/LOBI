import { Request, Response } from "express";
import * as apartmentService from "../services/apartment.service";

export const createApartment = async (req: Request, res: Response) => {
  const apartment = await apartmentService.create(req.body);

  return res.status(201).json({
    message: "Apartment created successfully",
    apartment,
  });
};