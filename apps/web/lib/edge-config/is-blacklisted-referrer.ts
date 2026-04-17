import { getDomainWithoutWWW } from "@dub/utils";

export const isBlacklistedReferrer = async (referrer: string | null) => {
  if (process.env.SELF_HOSTED === "true" || !process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  const hostname = referrer ? getDomainWithoutWWW(referrer) : "(direct)";
  let referrers;
  try {
    const { get } = require("@vercel/edge-config");
    referrers = await get("referrers");
  } catch (e) {
    referrers = [];
  }
  return !referrers.includes(hostname);
};
