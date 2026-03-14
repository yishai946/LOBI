import z from "zod";

export const createApartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  buildingId: z.uuid("Invalid building ID"),
});

export const updateApartmentSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
});

export type CreateApartmentCommand = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentCommand = z.infer<typeof updateApartmentSchema>;
