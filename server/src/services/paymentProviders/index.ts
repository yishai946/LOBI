import { HttpError } from "../../utils/HttpError";
import { PaymentProvider } from "./paymentProvider";
import { StripePaymentProvider } from "./stripePaymentProvider";

let providerInstance: PaymentProvider | null = null;

const resolveProviderName = () =>
  (process.env.PAYMENT_PROVIDER || "stripe").toLowerCase();

export const getPaymentProvider = (): PaymentProvider => {
  if (providerInstance) {
    return providerInstance;
  }

  const providerName = resolveProviderName();

  switch (providerName) {
    case "stripe":
      providerInstance = new StripePaymentProvider();
      return providerInstance;
    default:
      throw new HttpError(`ספק תשלומים לא נתמך: ${providerName}`, 500);
  }
};
