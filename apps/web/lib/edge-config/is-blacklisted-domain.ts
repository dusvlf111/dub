export const isBlacklistedDomain = async (domain: string): Promise<boolean> => {
  // Self-hosted or no edge config: not blacklisted
  if (process.env.SELF_HOSTED === "true" || !process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  if (!domain) {
    return false;
  }

  try {
    const { getAll } = require("@vercel/edge-config");
    const {
      domains: blacklistedDomains,
      terms: blacklistedTerms,
      whitelistedDomains,
    } = await getAll(["domains", "terms", "whitelistedDomains"]);

    if (whitelistedDomains.includes(domain)) {
      return false;
    }

    const blacklistedTermsRegex = new RegExp(
      blacklistedTerms
        .map((term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|"),
    );

    return blacklistedDomains.includes(domain) || blacklistedTermsRegex.test(domain);
  } catch (e) {
    return false;
  }
};
