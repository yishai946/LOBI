import { Router } from "express";
import {
  createCheckoutSession,
  createPayment,
  deletePayment,
  getPublicReceipt,
  getPaymentAssignments,
  getPaymentById,
  getMyNextPayment,
  getMyPayments,
  getPayments,
  paymentWebhook,
  updatePayment,
} from "../controllers/payment.controller";
import { requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  checkoutPaymentSchema,
  createPaymentSchema,
  updatePaymentSchema,
} from "../validators/payment.validator";

const router = Router();
const webhookRouter = Router();
const publicRouter = Router();

router.post("/", requireManager, validate(createPaymentSchema), createPayment);
router.get("/", requireManager, getPayments);
router.get("/my", getMyPayments);
router.get("/my/next", getMyNextPayment);
router.get("/:paymentId/assignments", requireManager, getPaymentAssignments);
router.get("/:paymentId", requireManager, getPaymentById);
router.patch(
  "/:paymentId",
  requireManager,
  validate(updatePaymentSchema),
  updatePayment,
);
router.delete("/:paymentId", requireManager, deletePayment);
router.post(
  "/:assignmentId/checkout",
  validate(checkoutPaymentSchema),
  createCheckoutSession,
);

webhookRouter.post("/", paymentWebhook);
publicRouter.get("/receipt", getPublicReceipt);

export { webhookRouter as paymentWebhookRouter };
export { publicRouter as paymentPublicRouter };
export default router;
