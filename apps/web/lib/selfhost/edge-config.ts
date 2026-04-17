/**
 * Self-hosted Edge Config replacement.
 * Uses Redis to store configuration that Vercel Edge Config normally handles.
 * Since we're self-hosting, most blacklist/feature-flag features return permissive defaults.
 */
import { redis } from "./redis-compat";

const EDGE_CONFIG_PREFIX = "edge-config:";

// ---- get / getAll (Vercel Edge Config compatible) ----

export async function edgeConfigGet<T = any>(key: string): Promise<T | undefined> {
  try {
    const value = await redis.get<T>(`${EDGE_CONFIG_PREFIX}${key}`);
    return value ?? undefined;
  } catch {
    return undefined;
  }
}

export async function edgeConfigGetAll<T extends Record<string, any>>(
  keys: string[],
): Promise<T> {
  const result: Record<string, any> = {};
  for (const key of keys) {
    result[key] = (await edgeConfigGet(key)) ?? [];
  }
  return result as T;
}

// ---- Feature Flags ----

export const getFeatureFlags = async ({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId?: string;
  workspaceSlug?: string;
}) => {
  // In self-hosted mode, enable all features by default
  return {
    noDubLink: true,
    analyticsSettingsSiteVisitTracking: true,
  };
};

export const getPartnerFeatureFlags = async (_partnerId: string) => {
  // In self-hosted mode, enable all partner features
  return {
    postbacks: true,
  };
};

// ---- Blacklists (permissive in self-hosted) ----

export const isBlacklistedDomain = async (_domain: string): Promise<boolean> => {
  return false;
};

export const isBlacklistedEmail = async (
  _email: string | string[],
): Promise<boolean> => {
  return false;
};

export const isBlacklistedKey = async (_key: string): Promise<boolean> => {
  return false;
};

export const isBlacklistedReferrer = async (
  _referrer: string | null,
): Promise<boolean> => {
  return false;
};

export const isReservedUsername = async (_key: string): Promise<boolean> => {
  return false;
};

// ---- Update Config ----

export const updateConfig = async ({
  key,
  value,
}: {
  key: string;
  value: string;
}) => {
  try {
    const existing = (await edgeConfigGet<string[]>(key)) || [];
    const newData = Array.from(new Set([...existing, value]));
    await redis.set(`${EDGE_CONFIG_PREFIX}${key}`, newData);
  } catch (error) {
    console.error("[SelfHosted EdgeConfig] Failed to update config:", error);
  }
};
