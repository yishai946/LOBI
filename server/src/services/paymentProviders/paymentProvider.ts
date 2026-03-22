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
}

export interface ProviderWebhookEvent {
  type: string;
  session?: ProviderSessionSnapshot;
}

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
