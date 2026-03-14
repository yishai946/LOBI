import z from "zod";

export const createBuildingSchema = z.object({
  name: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  logoUrl: z.url("Invalid URL").optional(),
});

export const updateBuildingSchema = z.object({
  name: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters").optional(),
  logoUrl: z.url("Invalid URL").optional(),
});

export type CreateBuildingCommand = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingCommand = z.infer<typeof updateBuildingSchema>;
