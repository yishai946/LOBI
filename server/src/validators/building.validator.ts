import z from "zod";

export const createBuildingSchema = z.object({
  name: z.string().optional(),
  address: z.string().min(5, "הכתובת חייבת להכיל לפחות 5 תווים"),
  logoUrl: z.url("כתובת URL לא תקינה").optional(),
});

export const updateBuildingSchema = z.object({
  name: z.string().optional(),
  address: z.string().min(5, "הכתובת חייבת להכיל לפחות 5 תווים").optional(),
  logoUrl: z.url("כתובת URL לא תקינה").optional(),
});

export type CreateBuildingCommand = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingCommand = z.infer<typeof updateBuildingSchema>;
