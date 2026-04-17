const isSelfHosted = process.env.SELF_HOSTED === "true";

let tb: any;

if (isSelfHosted) {
  const { SelfHostedTinybird } = require("../selfhost/tinybird-compat");
  tb = new SelfHostedTinybird();
} else {
  const { Tinybird } = require("@chronark/zod-bird");
  tb = new Tinybird({
    token: process.env.TINYBIRD_API_KEY as string,
    baseUrl: process.env.TINYBIRD_API_URL as string,
  });
}

export { tb };
