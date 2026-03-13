import { Request, Response } from "express";
import Stripe from "stripe";
import * as paymentService from "../services/payment.service";
import { HttpError } from "../utils/HttpError";

export const createPayment = async (req: Request, res: Response) => {
  const { payment } = await paymentService.createPayment(req.user, req.body);

  return res.status(201).json({
    message: "Payment created successfully",
    payment,
  });
};

export const getPayments = async (req: Request, res: Response) => {
  const buildingId = req.query.buildingId as string | undefined;
  const payments = await paymentService.getPayments(req.user, buildingId);

  res.json(payments);
};

export const getMyPayments = async (req: Request, res: Response) => {
  const payments = await paymentService.getMyPayments(req.user);

  res.json(payments);
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  const result = await paymentService.createCheckoutSession(
    req.user,
    req.params.assignmentId as string,
    req.body,
    req.headers.origin as string | undefined,
  );

  res.json(result);
};

export const paymentWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || Array.isArray(signature)) {
    throw new HttpError("Missing Stripe signature", 400);
  }

  const event = paymentService.constructStripeEvent(req.body, signature);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await paymentService.markAssignmentPaid(
      session.id,
      session.metadata?.userId,
    );
  }

  res.json({ received: true });
};
