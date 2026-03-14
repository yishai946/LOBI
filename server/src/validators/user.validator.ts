import z from "zod";

export const createResidentSchema = z.object({
  phone: z
    .string()
    .regex(
      /^05\d{8}$/,
      "Phone number must start with 05 and be 10 digits long",
    ),
  apartmentId: z.uuid("Invalid apartment ID"),
});

export const createManagerSchema = z.object({
  phone: z
  .string()
  .regex(
    /^05\d{8}$/,
    "Phone number must start with 05 and be 10 digits long",
  ),
  apartmentId: z.uuid("Invalid apartment ID").optional(),
  buildingId: z.uuid("Invalid building ID"),
});

export const updateMeSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
});

export type CreateResidentCommand = z.infer<typeof createResidentSchema>;
export type CreateManagerCommand = z.infer<typeof createManagerSchema>;
export type UpdateMeCommand = z.infer<typeof updateMeSchema>;
