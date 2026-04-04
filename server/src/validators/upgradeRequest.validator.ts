import z from "zod";

export const upgradeRequestSchema = z.object({
  featureRequested: z.enum(["DIGITAL_PAYMENTS"]),
});

export type UpgradeRequestCommand = z.infer<typeof upgradeRequestSchema>;
