import Stripe from "stripe";
import { StripeMode } from "../types";

// Lazy-init Stripe client. Next.js "Collecting page data" imports every route
// module at build time; a module-level `new Stripe(...)` with a missing/empty
// key crashes the build with "Neither apiKey nor config.authenticator provided".
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not set. Stripe features are disabled on this deployment.",
      );
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: "2025-05-28.basil",
      appInfo: { name: "Dub.co", version: "0.1.0" },
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

const secretMap: Record<StripeMode, string | undefined> = {
  live: process.env.STRIPE_APP_SECRET_KEY,
  test: process.env.STRIPE_APP_SECRET_KEY_TEST,
  sandbox: process.env.STRIPE_APP_SECRET_KEY_SANDBOX,
};

// Stripe Integration App client
export const stripeAppClient = ({ mode }: { mode?: StripeMode }) => {
  const appSecretKey = secretMap[mode ?? "live"];

  return new Stripe(appSecretKey!, {
    apiVersion: "2025-05-28.basil",
    appInfo: {
      name: "Dub.co",
      version: "0.1.0",
    },
  });
};
