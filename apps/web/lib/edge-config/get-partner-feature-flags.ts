import { PartnerBetaFeatures } from "../types";

type PartnerBetaFeaturesRecord = Partial<Record<PartnerBetaFeatures, string[]>>;

export const getPartnerFeatureFlags = async (partnerId: string) => {
  const partnerFeatures: Record<PartnerBetaFeatures, boolean> = {
    postbacks: false,
  };

  // Self-hosted or no edge config: enable all features
  if (process.env.SELF_HOSTED === "true" || !process.env.EDGE_CONFIG) {
    return Object.fromEntries(
      Object.entries(partnerFeatures).map(([key, _v]) => [key, true]),
    );
  }

  let betaFeatures: PartnerBetaFeaturesRecord | undefined = undefined;

  try {
    const { get } = require("@vercel/edge-config");
    betaFeatures = await get("partnerBetaFeatures");
  } catch (e) {
    console.error(`Error getting partner beta features: ${e}`);
  }

  if (!betaFeatures) {
    return partnerFeatures;
  }

  for (const [featureFlag, partnerIds] of Object.entries(betaFeatures)) {
    if (partnerIds?.includes(partnerId)) {
      partnerFeatures[featureFlag] = true;
    }
  }

  return partnerFeatures;
};
