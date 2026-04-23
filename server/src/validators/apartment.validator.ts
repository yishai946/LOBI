import z from "zod";

export const createApartmentSchema = z.object({
  buildingId: z.uuid("דרוש מזהה בניין תקין"),
  apartmentNumber: z.string().min(1, "מספר הדירה נדרש"),
  floorNumber: z.number().int("מספר קומה חייב להיות מספר שלם"),
});

export const updateApartmentSchema = createApartmentSchema.partial();

export type CreateApartmentCommand = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentCommand = z.infer<typeof updateApartmentSchema>;
