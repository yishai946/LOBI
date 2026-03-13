import { Router } from "express";
import {
  createCheckoutSession,
  createPayment,
  getMyPayments,
  getPayments,
  paymentWebhook,
} from "../controllers/payment.controller";
import { requireManager, requireResident } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  checkoutPaymentSchema,
  createPaymentSchema,
} from "../validators/payment.validator";

const router = Router();
const webhookRouter = Router();

router.post("/", requireManager, validate(createPaymentSchema), createPayment);
router.get("/", requireManager, getPayments);
router.get("/my", requireResident, getMyPayments);
router.post(
  "/:assignmentId/checkout",
  requireResident,
  validate(checkoutPaymentSchema),
  createCheckoutSession,
);

webhookRouter.post("/", paymentWebhook);

export { webhookRouter as paymentWebhookRouter };
export default router;
