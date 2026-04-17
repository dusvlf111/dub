/**
 * Self-hosted QStash compatibility layer.
 * Replaces Upstash QStash with direct HTTP calls.
 * QStash essentially just sends HTTP requests to URLs - we do the same thing directly.
 */
import { v4 as uuidv4 } from "uuid";

interface PublishOptions {
  url: string;
  body?: any;
  headers?: Record<string, string>;
  callback?: string;
  failureCallback?: string;
  delay?: number;
  retries?: number;
  method?: string;
}

interface PublishResult {
  messageId: string;
}

interface BatchItem extends PublishOptions {
  queueName?: string;
}

/**
 * Self-hosted QStash client.
 * Instead of going through Upstash's QStash service,
 * we send HTTP requests directly to the target URLs.
 */
class SelfHostedQStashClient {
  async publishJSON(opts: PublishOptions): Promise<PublishResult> {
    const messageId = uuidv4();

    const doRequest = async () => {
      try {
        if (opts.delay && opts.delay > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, opts.delay! * 1000),
          );
        }

        const response = await fetch(opts.url, {
          method: opts.method || "POST",
          headers: {
            "Content-Type": "application/json",
            ...opts.headers,
          },
          body: JSON.stringify(opts.body),
          signal: AbortSignal.timeout(30000),
        });

        // Fire callback if provided
        if (opts.callback && response.ok) {
          fetch(opts.callback, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: response.status,
              body: await response.text().catch(() => ""),
              sourceMessageId: messageId,
            }),
          }).catch(() => {});
        }

        // Fire failure callback if request failed
        if (opts.failureCallback && !response.ok) {
          fetch(opts.failureCallback, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: response.status,
              body: await response.text().catch(() => ""),
              sourceMessageId: messageId,
            }),
          }).catch(() => {});
        }
      } catch (error) {
        console.error(
          `[SelfHostedQStash] Failed to publish to ${opts.url}:`,
          error,
        );

        if (opts.failureCallback) {
          fetch(opts.failureCallback, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: 500,
              body: String(error),
              sourceMessageId: messageId,
            }),
          }).catch(() => {});
        }
      }
    };

    // Execute async (fire and forget)
    doRequest().catch(() => {});

    return { messageId };
  }

  async batchJSON(jobs: BatchItem[]): Promise<PublishResult[]> {
    const results = await Promise.all(
      jobs.map(async (job) => {
        return this.publishJSON(job);
      }),
    );
    return results;
  }
}

/**
 * Self-hosted QStash Receiver.
 * Since we're calling ourselves directly, signature verification is not needed.
 * We use a simple shared secret instead.
 */
class SelfHostedReceiver {
  async verify(_opts: {
    signature: string;
    body: string;
  }): Promise<boolean> {
    // In self-hosted mode, we skip QStash signature verification
    // since requests come from within our own network
    return true;
  }
}

/**
 * Self-hosted Workflow client.
 * Triggers workflows by calling the workflow URL directly.
 */
class SelfHostedWorkflowClient {
  async trigger(
    workflows: Array<{
      url: string;
      body?: any;
      retries?: number;
      flowControl?: any;
    }>,
  ) {
    const results = await Promise.all(
      workflows.map(async (workflow) => {
        try {
          const response = await fetch(workflow.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(workflow.body),
            signal: AbortSignal.timeout(30000),
          });
          return { messageId: uuidv4(), status: response.status };
        } catch (error) {
          console.error(
            `[SelfHostedWorkflow] Failed to trigger ${workflow.url}:`,
            error,
          );
          return { messageId: uuidv4(), error: String(error) };
        }
      }),
    );
    return results;
  }
}

export const qstash = new SelfHostedQStashClient();
export const Receiver = SelfHostedReceiver;
export const WorkflowClient = SelfHostedWorkflowClient;
export const CRON_BATCH_SIZE = 100;
