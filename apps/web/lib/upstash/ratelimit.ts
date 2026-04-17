const isSelfHosted = process.env.SELF_HOSTED === "true";

let ratelimit: (
  requests?: number,
  seconds?:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d`,
) => any;

if (isSelfHosted) {
  const selfHosted = require("../selfhost/ratelimit");
  ratelimit = selfHosted.ratelimit;
} else {
  const { Ratelimit } = require("@upstash/ratelimit");
  const { redis } = require("./redis");

  ratelimit = (
    requests: number = 10,
    seconds:
      | `${number} ms`
      | `${number} s`
      | `${number} m`
      | `${number} h`
      | `${number} d` = "10 s",
  ) => {
    return new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(requests, seconds),
      analytics: true,
      prefix: "dub",
      timeout: 1000,
    });
  };
}

export { ratelimit };
