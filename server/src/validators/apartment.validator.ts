import z from "zod";

export const createApartmentSchema = z.object({
  buildingId: z.uuid("דרוש מזהה בניין תקין"),
  name: z.string().min(1, "שם הדירה נדרש"),
});

export const updateApartmentSchema = z.object({
  name: z.string().min(1, "שם הדירה נדרש").optional(),
});

export type CreateApartmentCommand = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentCommand = z.infer<typeof updateApartmentSchema>;
