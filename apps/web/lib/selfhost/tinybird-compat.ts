/**
 * Self-hosted Tinybird compatibility layer.
 * Replaces @chronark/zod-bird with direct ClickHouse HTTP API calls.
 * Implements buildIngestEndpoint and buildPipe with the same API.
 */

const CLICKHOUSE_URL =
  process.env.CLICKHOUSE_URL || "http://localhost:8123";
const CLICKHOUSE_DB = process.env.CLICKHOUSE_DB || "dub";

async function clickhouseQuery(query: string): Promise<any[]> {
  const url = new URL(CLICKHOUSE_URL);
  url.searchParams.set("database", CLICKHOUSE_DB);
  url.searchParams.set("default_format", "JSONEachRow");

  const response = await fetch(url.toString(), {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ClickHouse] Query error:", errorText, "\nQuery:", query);
    throw new Error(`ClickHouse query failed: ${errorText}`);
  }

  const text = await response.text();
  if (!text.trim()) return [];

  return text
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

async function clickhouseInsert(table: string, data: any | any[]): Promise<void> {
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return;

  const url = new URL(CLICKHOUSE_URL);
  url.searchParams.set("database", CLICKHOUSE_DB);
  url.searchParams.set(
    "query",
    `INSERT INTO ${table} FORMAT JSONEachRow`,
  );

  const body = rows.map((row) => JSON.stringify(row)).join("\n");

  const response = await fetch(url.toString(), {
    method: "POST",
    body,
    headers: { "Content-Type": "text/plain" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ClickHouse] Insert error:", errorText);
    throw new Error(`ClickHouse insert failed: ${errorText}`);
  }
}

// ---- Pipe SQL Templates ----

function escapeStr(s: string): string {
  if (!s) return "''";
  return "'" + s.replace(/'/g, "\\'") + "'";
}

function escapeArray(arr: string[]): string {
  if (!arr || arr.length === 0) return "[]";
  return "[" + arr.map(escapeStr).join(",") + "]";
}

function buildWhereClause(params: Record<string, any>): string {
  const conditions: string[] = [];

  if (params.workspaceId) {
    conditions.push(`workspace_id = ${escapeStr(params.workspaceId)}`);
  }

  if (params.start) {
    conditions.push(`timestamp >= toDateTime64(${escapeStr(params.start)}, 3)`);
  }
  if (params.end) {
    conditions.push(`timestamp <= toDateTime64(${escapeStr(params.end)}, 3)`);
  }

  // Link filtering
  if (params.linkId) {
    const linkIds = params.linkId.split(",");
    if (params.linkIdOperator === "not") {
      conditions.push(
        `link_id NOT IN (${linkIds.map(escapeStr).join(",")})`,
      );
    } else {
      conditions.push(
        `link_id IN (${linkIds.map(escapeStr).join(",")})`,
      );
    }
  }

  // Domain filtering
  if (params.domain) {
    const domains = params.domain.split(",");
    if (params.domainOperator === "not") {
      conditions.push(
        `domain NOT IN (${domains.map(escapeStr).join(",")})`,
      );
    } else {
      conditions.push(
        `domain IN (${domains.map(escapeStr).join(",")})`,
      );
    }
  }

  // Country filtering
  if (params.country) {
    conditions.push(`country = ${escapeStr(params.country)}`);
  }

  // Region filtering
  if (params.region) {
    conditions.push(`region = ${escapeStr(params.region)}`);
  }

  // Trigger filtering
  if (params.trigger) {
    if (params.trigger === "qr") {
      conditions.push(`qr = 1`);
    } else if (params.trigger === "link") {
      conditions.push(`qr = 0`);
    }
  }

  // Customer ID
  if (params.customerId) {
    conditions.push(`customer_id = ${escapeStr(params.customerId)}`);
  }

  // Root filter (only direct links)
  if (params.root === "true") {
    conditions.push(`key = '_root'`);
  }

  return conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
}

function getGroupByColumn(groupBy: string): string {
  const mapping: Record<string, string> = {
    top_links: "link_id",
    top_urls: "url",
    top_base_urls: "url",
    countries: "country",
    regions: "region",
    cities: "city",
    continents: "continent",
    devices: "device",
    browsers: "browser",
    os: "os",
    triggers: "trigger",
    referers: "referer",
    referer_urls: "referer_url",
    utm_source: "referer",
    utm_medium: "referer",
    utm_campaign: "referer",
    utm_term: "referer",
    utm_content: "referer",
  };
  return mapping[groupBy] || groupBy;
}

function getGranularityExpr(
  granularity: string | undefined,
  timezone: string,
): string {
  const tz = timezone || "UTC";
  switch (granularity) {
    case "minute":
      return `toStartOfMinute(timestamp, '${tz}')`;
    case "hour":
      return `toStartOfHour(timestamp, '${tz}')`;
    case "day":
      return `toStartOfDay(timestamp, '${tz}')`;
    case "month":
      return `toStartOfMonth(timestamp, '${tz}')`;
    default:
      return `toStartOfDay(timestamp, '${tz}')`;
  }
}

// Pipe implementations
const PIPE_HANDLERS: Record<
  string,
  (params: Record<string, any>) => string
> = {
  // ---- Simple lookups ----
  get_click_event: (p) =>
    `SELECT * FROM dub_click_events_id WHERE click_id = ${escapeStr(p.clickId)} ORDER BY timestamp DESC LIMIT 1`,

  get_lead_event: (p) => {
    let query = `SELECT * FROM dub_lead_events_mv WHERE customer_id = ${escapeStr(p.customerId)}`;
    if (p.eventName) {
      query += ` AND event_name = ${escapeStr(p.eventName)}`;
    }
    query += ` ORDER BY timestamp DESC`;
    return query;
  },

  get_lead_events: (p) => {
    const ids = Array.isArray(p.customerIds) ? p.customerIds : [p.customerIds];
    return `SELECT * FROM dub_lead_events_mv WHERE customer_id IN (${ids.map(escapeStr).join(",")}) ORDER BY timestamp DESC`;
  },

  get_webhook_events: (p) =>
    `SELECT * FROM dub_webhook_events WHERE webhook_id = ${escapeStr(p.webhookId)} ORDER BY timestamp DESC LIMIT 100`,

  get_postback_events: (p) =>
    `SELECT * FROM dub_postback_events WHERE postback_id = ${escapeStr(p.postbackId)} ORDER BY timestamp DESC LIMIT 100`,

  get_import_error_logs: (p) =>
    `SELECT * FROM dub_import_error_logs WHERE workspace_id = ${escapeStr(p.workspaceId)} AND import_id = ${escapeStr(p.importId)} ORDER BY timestamp DESC LIMIT 5000`,

  get_audit_logs: (p) => {
    const conditions: string[] = [];
    if (p.workspaceId) conditions.push(`workspace_id = ${escapeStr(p.workspaceId)}`);
    if (p.programId) conditions.push(`program_id = ${escapeStr(p.programId)}`);
    if (p.start) conditions.push(`timestamp >= toDateTime64(${escapeStr(p.start)}, 3)`);
    if (p.end) conditions.push(`timestamp <= toDateTime64(${escapeStr(p.end)}, 3)`);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return `SELECT * FROM dub_audit_logs ${where} ORDER BY timestamp DESC LIMIT 100`;
  },

  get_api_logs: (p) => {
    const conditions: string[] = [];
    if (p.workspaceId) conditions.push(`workspace_id = ${escapeStr(p.workspaceId)}`);
    if (p.routePattern) conditions.push(`route_pattern = ${escapeStr(p.routePattern)}`);
    if (p.method) conditions.push(`method = ${escapeStr(p.method)}`);
    if (p.statusCode) conditions.push(`status_code = ${Number(p.statusCode)}`);
    if (p.tokenId) conditions.push(`token_id = ${escapeStr(p.tokenId)}`);
    if (p.start) conditions.push(`timestamp >= toDateTime64(${escapeStr(p.start)}, 3)`);
    if (p.end) conditions.push(`timestamp <= toDateTime64(${escapeStr(p.end)}, 3)`);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = p.limit ? Number(p.limit) : 50;
    const offset = p.offset ? Number(p.offset) : 0;
    return `SELECT * FROM dub_api_logs ${where} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
  },

  get_api_logs_count: (p) => {
    const conditions: string[] = [];
    if (p.workspaceId) conditions.push(`workspace_id = ${escapeStr(p.workspaceId)}`);
    if (p.start) conditions.push(`timestamp >= toDateTime64(${escapeStr(p.start)}, 3)`);
    if (p.end) conditions.push(`timestamp <= toDateTime64(${escapeStr(p.end)}, 3)`);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    return `SELECT count() as count FROM dub_api_logs ${where}`;
  },

  get_api_log_by_id: (p) =>
    `SELECT * FROM dub_api_logs_id WHERE id = ${escapeStr(p.id)} LIMIT 1`,

  // ---- Analytics: Count ----
  v4_count: (p) => {
    const where = buildWhereClause(p);
    const eventType = p.eventType || "clicks";

    if (eventType === "composite" || eventType === "clicks") {
      return `
        SELECT
          'count' as groupByField,
          countIf(1, 1=1) as clicks,
          0 as leads,
          0 as sales,
          0 as saleAmount
        FROM dub_click_events_mv
        ${where}
      `;
    }

    if (eventType === "leads") {
      return `
        SELECT
          'count' as groupByField,
          0 as clicks,
          count() as leads,
          0 as sales,
          0 as saleAmount
        FROM dub_lead_events_mv
        ${where}
      `;
    }

    if (eventType === "sales") {
      return `
        SELECT
          'count' as groupByField,
          0 as clicks,
          0 as leads,
          count() as sales,
          sum(amount) as saleAmount
        FROM dub_sale_events_mv
        ${where}
      `;
    }

    // Composite: combine all event types
    return `
      SELECT
        'count' as groupByField,
        (SELECT count() FROM dub_click_events_mv ${where}) as clicks,
        (SELECT count() FROM dub_lead_events_mv ${where}) as leads,
        (SELECT count() FROM dub_sale_events_mv ${where}) as sales,
        (SELECT sum(amount) FROM dub_sale_events_mv ${where}) as saleAmount
    `;
  },

  // ---- Analytics: Timeseries ----
  v4_timeseries: (p) => {
    const where = buildWhereClause(p);
    const granExpr = getGranularityExpr(p.granularity, p.timezone);
    const eventType = p.eventType || "clicks";

    const table =
      eventType === "leads"
        ? "dub_lead_events_mv"
        : eventType === "sales"
          ? "dub_sale_events_mv"
          : "dub_click_events_mv";

    const metricsSelect =
      eventType === "sales"
        ? `count() as sales, sum(amount) as saleAmount, 0 as clicks, 0 as leads`
        : eventType === "leads"
          ? `count() as leads, 0 as clicks, 0 as sales, 0 as saleAmount`
          : `count() as clicks, 0 as leads, 0 as sales, 0 as saleAmount`;

    return `
      SELECT
        ${granExpr} as groupByField,
        ${metricsSelect}
      FROM ${table}
      ${where}
      GROUP BY groupByField
      ORDER BY groupByField ASC
    `;
  },

  // ---- Analytics: Group By ----
  v4_group_by: (p) => {
    const where = buildWhereClause(p);
    const groupBy = p.groupBy || "countries";
    const column = getGroupByColumn(groupBy);
    const eventType = p.eventType || "clicks";

    const table =
      eventType === "leads"
        ? "dub_lead_events_mv"
        : eventType === "sales"
          ? "dub_sale_events_mv"
          : "dub_click_events_mv";

    let metricsSelect: string;
    if (eventType === "sales") {
      metricsSelect = `count() as sales, sum(amount) as saleAmount, 0 as clicks, 0 as leads`;
    } else if (eventType === "leads") {
      metricsSelect = `count() as leads, 0 as clicks, 0 as sales, 0 as saleAmount`;
    } else {
      metricsSelect = `count() as clicks, 0 as leads, 0 as sales, 0 as saleAmount`;
    }

    let extraSelect = "";
    if (groupBy === "cities" || groupBy === "regions") {
      extraSelect = ", any(country) as country";
    }
    if (groupBy === "regions") {
      extraSelect += ", any(region) as region";
    }

    return `
      SELECT
        ${column} as groupByField,
        ${metricsSelect}
        ${extraSelect}
      FROM ${table}
      ${where}
      GROUP BY groupByField
      ORDER BY clicks DESC, leads DESC, sales DESC
      LIMIT 100
    `;
  },

  // ---- Analytics: Group By Link Metadata ----
  v4_group_by_link_metadata: (p) => {
    const where = buildWhereClause(p);
    const groupBy = p.groupBy || "top_domains";
    const eventType = p.eventType || "clicks";

    const table =
      eventType === "leads"
        ? "dub_lead_events_mv"
        : eventType === "sales"
          ? "dub_sale_events_mv"
          : "dub_click_events_mv";

    let metadataColumn: string;
    switch (groupBy) {
      case "top_domains":
        metadataColumn = "lm.domain";
        break;
      case "top_folders":
        metadataColumn = "lm.folder_id";
        break;
      case "top_link_tags":
        // Need to use arrayJoin for tag_ids
        return `
          SELECT
            tag_id as groupByField,
            count() as clicks,
            0 as leads, 0 as sales, 0 as saleAmount
          FROM dub_click_events_mv e
          INNER JOIN (
            SELECT link_id, arrayJoin(tag_ids) as tag_id
            FROM dub_links_metadata_latest FINAL
            WHERE workspace_id = ${escapeStr(p.workspaceId)}
          ) lm ON e.link_id = lm.link_id
          ${where}
          GROUP BY groupByField
          ORDER BY clicks DESC
          LIMIT 100
        `;
      case "top_partners":
        metadataColumn = "lm.partner_id";
        break;
      case "top_groups":
        metadataColumn = "lm.partner_group_id";
        break;
      default:
        metadataColumn = "lm.domain";
    }

    let metricsSelect: string;
    if (eventType === "sales") {
      metricsSelect = `count() as sales, sum(e.amount) as saleAmount, 0 as clicks, 0 as leads`;
    } else if (eventType === "leads") {
      metricsSelect = `count() as leads, 0 as clicks, 0 as sales, 0 as saleAmount`;
    } else {
      metricsSelect = `count() as clicks, 0 as leads, 0 as sales, 0 as saleAmount`;
    }

    return `
      SELECT
        ${metadataColumn} as groupByField,
        ${metricsSelect}
      FROM ${table} e
      INNER JOIN dub_links_metadata_latest lm FINAL ON e.link_id = lm.link_id
      ${where}
      AND ${metadataColumn} != ''
      GROUP BY groupByField
      ORDER BY clicks DESC, leads DESC, sales DESC
      LIMIT 100
    `;
  },

  // ---- v3 group by link country ----
  v3_group_by_link_country: (p) => {
    const linkIds = Array.isArray(p.linkIds) ? p.linkIds : [p.linkIds];
    return `
      SELECT
        link_id,
        country,
        count() as clicks
      FROM dub_click_events_mv
      WHERE link_id IN (${linkIds.map(escapeStr).join(",")})
        AND timestamp >= toDateTime64(${escapeStr(p.start)}, 3)
        AND timestamp <= toDateTime64(${escapeStr(p.end)}, 3)
      GROUP BY link_id, country
      ORDER BY link_id ASC, clicks DESC
    `;
  },

  // ---- v2 customer events ----
  v2_customer_events: (p) => {
    const conditions: string[] = [];
    if (p.customerId)
      conditions.push(`customer_id = ${escapeStr(p.customerId)}`);
    if (p.linkIds) {
      const ids = Array.isArray(p.linkIds) ? p.linkIds : [p.linkIds];
      conditions.push(`link_id IN (${ids.map(escapeStr).join(",")})`);
    }
    const where =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    return `
      SELECT * FROM (
        SELECT timestamp, 'lead' as event_type, event_id, event_name, customer_id, link_id, click_id, '' as invoice_id, 0 as amount, '' as currency, '' as payment_processor, metadata
        FROM dub_lead_events_mv ${where}
        UNION ALL
        SELECT timestamp, 'sale' as event_type, event_id, event_name, customer_id, link_id, click_id, invoice_id, amount, currency, payment_processor, metadata
        FROM dub_sale_events_mv ${where}
      )
      ORDER BY timestamp DESC
      LIMIT 100
    `;
  },

  // ---- v4 events ----
  v4_events: (p) => {
    const where = buildWhereClause(p);
    const eventType = p.eventType || "clicks";
    const limit = p.limit ? Number(p.limit) : 50;
    const offset = p.offset ? Number(p.offset) : 0;

    if (eventType === "leads") {
      return `SELECT * FROM dub_lead_events_mv ${where} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
    }
    if (eventType === "sales") {
      return `SELECT * FROM dub_sale_events_mv ${where} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
    }
    return `SELECT * FROM dub_click_events_mv ${where} ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
  },
};

/**
 * Self-hosted Tinybird-compatible class.
 * Drop-in replacement for @chronark/zod-bird Tinybird.
 */
export class SelfHostedTinybird {
  buildIngestEndpoint<T>({
    datasource,
    event: eventSchema,
    wait,
  }: {
    datasource: string;
    event: any;
    wait?: boolean;
  }): (data: T | T[]) => Promise<void> {
    return async (data: T | T[]) => {
      const rows = Array.isArray(data) ? data : [data];

      // Parse through zod schema if available
      const parsed = rows.map((row) => {
        try {
          return eventSchema.parse(row);
        } catch {
          return row;
        }
      });

      // Add timestamp if not present
      const withTimestamp = parsed.map((row: any) => ({
        timestamp:
          row.timestamp || new Date().toISOString().replace("T", " ").replace("Z", ""),
        ...row,
      }));

      await clickhouseInsert(datasource, withTimestamp);
    };
  }

  buildPipe<TParams, TData>({
    pipe,
    parameters: paramSchema,
    data: dataSchema,
  }: {
    pipe: string;
    parameters: any;
    data: any;
  }): (params: TParams) => Promise<{ data: TData[] }> {
    return async (params: TParams) => {
      const handler = PIPE_HANDLERS[pipe];
      if (!handler) {
        console.warn(`[SelfHostedTinybird] Unknown pipe: ${pipe}, returning empty data`);
        return { data: [] };
      }

      const query = handler(params as any);
      const rows = await clickhouseQuery(query);

      // Parse through zod schema if available
      const parsed = rows.map((row) => {
        try {
          return dataSchema.parse(row);
        } catch {
          return row;
        }
      });

      return { data: parsed as TData[] };
    };
  }
}

/**
 * Get the ClickHouse ingest URL for direct HTTP calls (used by record-click.ts).
 */
export function getClickHouseIngestUrl(datasource: string): string {
  const url = new URL(CLICKHOUSE_URL);
  url.searchParams.set("database", CLICKHOUSE_DB);
  url.searchParams.set("query", `INSERT INTO ${datasource} FORMAT JSONEachRow`);
  return url.toString();
}

export { clickhouseInsert, clickhouseQuery };
