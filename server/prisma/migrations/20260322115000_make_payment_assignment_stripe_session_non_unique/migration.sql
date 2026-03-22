-- Allow pay-all flows to store one Stripe checkout session ID on all participating assignments.
DROP INDEX IF EXISTS "PaymentAssignment_stripeSessionId_key";

CREATE INDEX IF NOT EXISTS "PaymentAssignment_stripeSessionId_idx"
ON "PaymentAssignment"("stripeSessionId");
