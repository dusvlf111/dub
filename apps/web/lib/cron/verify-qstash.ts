import { log } from "@dub/utils";
import { DubApiError } from "../api/errors";

const isSelfHosted = process.env.SELF_HOSTED === "true";

let receiver: any;

if (!isSelfHosted) {
  const { Receiver } = require("@upstash/qstash");
  receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
  });
}

export const verifyQstashSignature = async ({
  req,
  rawBody,
}: {
  req: Request;
  rawBody: string;
}) => {
  // Self-hosted: skip signature verification (internal network)
  if (isSelfHosted) {
    return;
  }

  // skip verification in local development
  if (process.env.VERCEL !== "1") {
    return;
  }

  const signature = req.headers.get("Upstash-Signature");

  if (!signature) {
    throw new DubApiError({
      code: "bad_request",
      message: "Upstash-Signature header not found.",
    });
  }

  const isValid = await receiver.verify({
    signature,
    body: rawBody,
  });

  if (!isValid) {
    const url = req.url;
    const messageId = req.headers.get("Upstash-Message-Id");

    log({
      message: `Invalid QStash request signature: *${url}* - *${messageId}*`,
      type: "errors",
      mention: true,
    });

    throw new DubApiError({
      code: "unauthorized",
      message: "Invalid QStash request signature.",
    });
  }
};
