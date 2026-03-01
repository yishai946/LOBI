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

export type CreateResidentCommand = z.infer<typeof createResidentSchema>;
