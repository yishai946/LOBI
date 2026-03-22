export interface CheckoutSessionLineItem {
  currency: string;
  unitAmount: number;
  title: string;
  description?: string;
  recurringMonthly?: boolean;
}

export interface CreateCheckoutSessionInput {
  mode: "payment" | "subscription";
  lineItems: CheckoutSessionLineItem[];
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface ProviderCheckoutSession {
  id: string;
  url: string;
}

export interface ProviderSessionSnapshot {
  id: string;
  metadata: Record<string, string>;
  subscriptionId?: string;
  customerId?: string;
}

export interface ProviderRecurringChargeSnapshot {
  id: string;
  subscriptionId?: string;
  customerId?: string;
  occurredAt?: Date;
}

export type ProviderWebhookEvent =
  | {
      type: "checkout.session.completed";
      session: ProviderSessionSnapshot;
    }
  | {
      type: "invoice.payment_succeeded" | "invoice.payment_failed";
      recurringCharge: ProviderRecurringChargeSnapshot;
    }
  | {
      type: "customer.subscription.updated" | "customer.subscription.deleted";
      subscription: {
        id: string;
        customerId?: string;
        status?: string;
      };
    }
  | {
      type: string;
    };

export interface PaymentProvider {
  readonly name: string;
  readonly webhookSignatureHeader: string;
  readonly receiptPaymentMethodLabel: string;
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<ProviderCheckoutSession>;
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): ProviderWebhookEvent;
  getSessionSnapshot(sessionId: string): Promise<ProviderSessionSnapshot>;
}
