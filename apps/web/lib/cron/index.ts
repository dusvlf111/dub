const isSelfHosted = process.env.SELF_HOSTED === "true";

let qstash: any;

if (isSelfHosted) {
  const selfHosted = require("../selfhost/qstash-compat");
  qstash = selfHosted.qstash;
} else {
  const { Client } = require("@upstash/qstash");
  qstash = new Client({
    token: process.env.QSTASH_TOKEN || "",
  });
}

// Default batch size for cron jobs that process records in batches
export const CRON_BATCH_SIZE = 100;

export { qstash };
