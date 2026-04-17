const isSelfHosted = process.env.SELF_HOSTED === "true";

export const updateConfig = async ({
  key,
  value,
}: {
  key:
    | "domains"
    | "whitelistedDomains"
    | "terms"
    | "referrers"
    | "keys"
    | "whitelist"
    | "emails"
    | "reserved"
    | "reservedUsernames"
    | "partnersPortal";
  value: string;
}) => {
  // Self-hosted: use Redis-based edge config
  if (isSelfHosted) {
    const { updateConfig: selfHostedUpdate } = require("../selfhost/edge-config");
    return selfHostedUpdate({ key, value });
  }

  if (!process.env.EDGE_CONFIG_ID) {
    return;
  }

  const { get } = require("@vercel/edge-config");
  const existingData = (await get(key)) as string[];
  const newData = Array.from(new Set([...existingData, value]));

  return await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items?teamId=${process.env.TEAM_ID_VERCEL}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.AUTH_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            operation: "update",
            key: key,
            value: newData,
          },
        ],
      }),
    },
  );
};
