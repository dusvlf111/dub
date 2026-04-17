const isSelfHosted = process.env.SELF_HOSTED === "true";

let vectorIndex: any;

if (isSelfHosted) {
  const selfHosted = require("../selfhost/vector");
  vectorIndex = selfHosted.vectorIndex;
} else {
  const { Index } = require("@upstash/vector");
  vectorIndex = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
  });
}

export { vectorIndex };
