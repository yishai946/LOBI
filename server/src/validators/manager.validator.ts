import z from "zod";

export const createManagerSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  buildingId: z.uuid("Invalid building ID"),
});

export type CreateManagerCommand = z.infer<typeof createManagerSchema>;
