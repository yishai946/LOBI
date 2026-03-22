import { Router } from "express";
import {
  createRecurringSeries,
  createCheckoutSession,
  createPayAllCheckoutSession,
  createPayment,
  deletePayment,
  getMyRecurringSeries,
  getPublicReceipt,
  getRecurringSeriesForManager,
  getPaymentAssignments,
  getPaymentById,
  getMyNextPayment,
  getMyPayments,
  getPayments,
  paymentWebhook,
  setMyRecurringEnrollment,
  updateRecurringSeries,
  updatePayment,
} from "../controllers/payment.controller";
import { requireManager } from "../middlewares/session.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  checkoutPaymentSchema,
  createRecurringSeriesSchema,
  createPaymentSchema,
  setRecurringEnrollmentSchema,
  updateRecurringSeriesSchema,
  updatePaymentSchema,
} from "../validators/payment.validator";

const router = Router();
const webhookRouter = Router();
const publicRouter = Router();

router.post("/", requireManager, validate(createPaymentSchema), createPayment);
router.post(
  "/recurring-series",
  requireManager,
  validate(createRecurringSeriesSchema),
  createRecurringSeries,
);
router.get("/recurring-series", requireManager, getRecurringSeriesForManager);
router.patch(
  "/recurring-series/:seriesId",
  requireManager,
  validate(updateRecurringSeriesSchema),
  updateRecurringSeries,
);
router.get("/", requireManager, getPayments);
router.get("/my", getMyPayments);
router.get("/my/next", getMyNextPayment);
router.get("/my/recurring-series", getMyRecurringSeries);
router.post(
  "/my/recurring-series/:seriesId/enrollment",
  validate(setRecurringEnrollmentSchema),
  setMyRecurringEnrollment,
);
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
router.post("/my/checkout-all", createPayAllCheckoutSession);

webhookRouter.post("/", paymentWebhook);
publicRouter.get("/receipt", getPublicReceipt);

export { webhookRouter as paymentWebhookRouter };
export { publicRouter as paymentPublicRouter };
export default router;
