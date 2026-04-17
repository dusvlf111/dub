import { prefixWorkspaceId } from "../api/workspaces/workspace-id";
import { BetaFeatures } from "../types";

const isSelfHosted = process.env.SELF_HOSTED === "true";

type BetaFeaturesRecord = Record<BetaFeatures, string[]>;

export const getFeatureFlags = async ({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId?: string;
  workspaceSlug?: string;
}) => {
  // Self-hosted: enable all features
  if (isSelfHosted) {
    return {
      noDubLink: true,
      analyticsSettingsSiteVisitTracking: true,
    };
  }

  if (workspaceId) {
    workspaceId = prefixWorkspaceId(workspaceId);
  }

  const workspaceFeatures: Record<BetaFeatures, boolean> = {
    noDubLink: false,
    analyticsSettingsSiteVisitTracking: false,
  };

  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return Object.fromEntries(
      Object.entries(workspaceFeatures).map(([key, _v]) => [key, true]),
    );
  } else if (!workspaceId && !workspaceSlug) {
    return workspaceFeatures;
  }

  let betaFeatures: BetaFeaturesRecord | undefined = undefined;

  try {
    const { get } = require("@vercel/edge-config");
    betaFeatures = await get("betaFeatures");
  } catch (e) {
    console.error(`Error getting beta features: ${e}`);
  }

  if (betaFeatures) {
    for (const [featureFlag, workspaceIdsOrSlugs] of Object.entries(
      betaFeatures,
    )) {
      if (
        (workspaceId && workspaceIdsOrSlugs.includes(workspaceId)) ||
        (workspaceSlug && workspaceIdsOrSlugs.includes(workspaceSlug))
      ) {
        workspaceFeatures[featureFlag] = true;
      }
    }
  }

  return workspaceFeatures;
};
