import { PlainClient } from "@team-plain/typescript-sdk";

export type PlainUser = {
  id: string;
  name: string | null;
  email: string | null;
};

// Lazy proxy: defer `new PlainClient(...)` until first property access.
// Without this, Next.js "Collecting page data" evaluates this module and
// crashes on self-hosted builds where PLAIN_API_KEY is absent / placeholder.
let instance: PlainClient | null = null;

function getClient(): PlainClient {
  if (!instance) {
    const apiKey = process.env.PLAIN_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PLAIN_API_KEY is not set. Plain features are disabled on this deployment.",
      );
    }
    instance = new PlainClient({ apiKey });
  }
  return instance;
}

export const plain = new Proxy({} as PlainClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
