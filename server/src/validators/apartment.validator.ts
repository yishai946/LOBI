import z from "zod";

export const createApartmentSchema = z.object({
  name: z.string().min(1, "שם נדרש"),
  buildingId: z.uuid("מזהה בניין לא תקין"),
});

export const updateApartmentSchema = z.object({
  name: z.string().min(1, "שם נדרש").optional(),
});

export type CreateApartmentCommand = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentCommand = z.infer<typeof updateApartmentSchema>;
