/**
 * Only for dub.sh / dub.link domains
 * Check if a username is reserved – should only be available on Pro+
 */
export const isReservedUsername = async (key: string) => {
  if (process.env.SELF_HOSTED === "true" || !process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  let reservedUsernames;
  try {
    const { get } = require("@vercel/edge-config");
    reservedUsernames = await get("reservedUsernames");
  } catch (e) {
    reservedUsernames = [];
  }
  return reservedUsernames.includes(key.toLowerCase());
};
