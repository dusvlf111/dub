const isSelfHosted = process.env.SELF_HOSTED === "true";

let redis: any;
let redisGlobal: any;
let redisGlobalWithTimeout: any;

if (isSelfHosted) {
  const selfHosted = require("../selfhost/redis-compat");
  redis = selfHosted.redis;
  redisGlobal = selfHosted.redisGlobal;
  redisGlobalWithTimeout = selfHosted.redisGlobalWithTimeout;
} else {
  const { Redis } = require("@upstash/redis");

  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  });

  const hasGlobalRedisConfig =
    !!process.env.UPSTASH_GLOBAL_REDIS_REST_URL &&
    !!process.env.UPSTASH_GLOBAL_REDIS_REST_TOKEN;

  const redisConfig = {
    url: hasGlobalRedisConfig
      ? process.env.UPSTASH_GLOBAL_REDIS_REST_URL
      : process.env.UPSTASH_REDIS_REST_URL || "",
    token: hasGlobalRedisConfig
      ? process.env.UPSTASH_GLOBAL_REDIS_REST_TOKEN
      : process.env.UPSTASH_REDIS_REST_TOKEN || "",
  };

  redisGlobal = new Redis(redisConfig);

  redisGlobalWithTimeout = new Redis({
    ...redisConfig,
    signal: () => AbortSignal.timeout(1500),
  });
}

export { redis, redisGlobal, redisGlobalWithTimeout };
