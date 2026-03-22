import Stripe from "stripe";
import { HttpError } from "../../utils/HttpError";
import {
  CreateCheckoutSessionInput,
  PaymentProvider,
  ProviderWebhookEvent,
  ProviderSessionSnapshot,
} from "./paymentProvider";

let stripeClient: Stripe | null = null;

const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new HttpError(
      "STRIPE_SECRET_KEY לא מוגדר. הוסף אותו לסביבת העבודה שלך.",
      500,
    );
  }

  stripeClient = new Stripe(apiKey);
  return stripeClient;
};

export class StripePaymentProvider implements PaymentProvider {
  public readonly name = "stripe";
  public readonly webhookSignatureHeader = "stripe-signature";
  public readonly receiptPaymentMethodLabel = "כרטיס אשראי (Stripe)";

  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<{ id: string; url: string }> {
    const session = await getStripeClient().checkout.sessions.create({
      mode: input.mode,
      payment_method_types: ["card"],
      line_items: input.lineItems.map((item) => ({
        price_data: {
          currency: item.currency.toLowerCase(),
          product_data: {
            name: item.title,
            description: item.description,
          },
          unit_amount: item.unitAmount,
          ...(item.recurringMonthly
            ? { recurring: { interval: "month" as const } }
            : {}),
        },
        quantity: 1,
      })),
      metadata: input.metadata,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) {
      throw new HttpError("כתובת URL של Stripe לא זמינה", 500);
    }

    return {
      id: session.id,
      url: session.url,
    };
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): ProviderWebhookEvent {
    const event = getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      return {
        type: event.type,
        session: {
          id: session.id,
          metadata: session.metadata ?? {},
          subscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : undefined,
          customerId:
            typeof session.customer === "string" ? session.customer : undefined,
        },
      };
    }

    if (
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.payment_failed"
    ) {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceLike = invoice as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      };

      return {
        type: event.type,
        recurringCharge: {
          id: invoice.id,
          subscriptionId:
            typeof invoiceLike.subscription === "string"
              ? invoiceLike.subscription
              : undefined,
          customerId:
            typeof invoice.customer === "string" ? invoice.customer : undefined,
          occurredAt: new Date(invoice.created * 1000),
        },
      };
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      return {
        type: event.type,
        subscription: {
          id: subscription.id,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : undefined,
          status: subscription.status,
        },
      };
    }

    return { type: event.type };
  }

  async getSessionSnapshot(
    sessionId: string,
  ): Promise<ProviderSessionSnapshot> {
    const session =
      await getStripeClient().checkout.sessions.retrieve(sessionId);

    return {
      id: session.id,
      metadata: session.metadata ?? {},
      subscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : undefined,
      customerId:
        typeof session.customer === "string" ? session.customer : undefined,
    };
  }
}
