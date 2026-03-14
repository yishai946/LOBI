import z from "zod";

export const createResidentSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  apartmentId: z.uuid("Invalid apartment ID"),
});

export const updateResidentSchema = z.object({
  apartmentId: z.uuid("Invalid apartment ID").optional(),
});

export type CreateResidentCommand = z.infer<typeof createResidentSchema>;
export type UpdateResidentCommand = z.infer<typeof updateResidentSchema>;
