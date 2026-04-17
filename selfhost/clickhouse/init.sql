-- ============================================
-- Dub Self-Hosted ClickHouse Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS dub;

-- ---- Click Events (main) ----
CREATE TABLE IF NOT EXISTS dub.dub_click_events
(
    timestamp DateTime64(3),
    click_id String,
    link_id String,
    alias_link_id Nullable(String),
    url String,
    country LowCardinality(String) DEFAULT 'Unknown',
    city String DEFAULT 'Unknown',
    region String DEFAULT 'Unknown',
    latitude String DEFAULT 'Unknown',
    longitude String DEFAULT 'Unknown',
    device LowCardinality(String) DEFAULT 'Desktop',
    device_model LowCardinality(String) DEFAULT 'Unknown',
    device_vendor LowCardinality(String) DEFAULT 'Unknown',
    browser LowCardinality(String) DEFAULT 'Unknown',
    browser_version String DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    os_version String DEFAULT 'Unknown',
    engine LowCardinality(String) DEFAULT 'Unknown',
    engine_version String DEFAULT 'Unknown',
    cpu_architecture LowCardinality(String) DEFAULT 'Unknown',
    ua String DEFAULT 'Unknown',
    bot UInt8 DEFAULT 0,
    referer String DEFAULT '(direct)',
    referer_url String DEFAULT '(direct)',
    user_id Nullable(Int64),
    identity_hash Nullable(String),
    ip String DEFAULT '',
    qr UInt8 DEFAULT 0,
    continent LowCardinality(String) DEFAULT '',
    vercel_region Nullable(String),
    trigger String DEFAULT 'link',
    workspace_id Nullable(String),
    domain Nullable(String),
    key Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, link_id, click_id);

-- ---- Click Events by ID (for quick lookups) ----
CREATE TABLE IF NOT EXISTS dub.dub_click_events_id
(
    timestamp DateTime64(3),
    click_id String,
    link_id String,
    alias_link_id Nullable(String),
    url String,
    country LowCardinality(String) DEFAULT 'Unknown',
    city String DEFAULT 'Unknown',
    region String DEFAULT 'Unknown',
    latitude String DEFAULT 'Unknown',
    longitude String DEFAULT 'Unknown',
    device LowCardinality(String) DEFAULT 'Desktop',
    device_model LowCardinality(String) DEFAULT 'Unknown',
    device_vendor LowCardinality(String) DEFAULT 'Unknown',
    browser LowCardinality(String) DEFAULT 'Unknown',
    browser_version String DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    os_version String DEFAULT 'Unknown',
    engine LowCardinality(String) DEFAULT 'Unknown',
    engine_version String DEFAULT 'Unknown',
    cpu_architecture LowCardinality(String) DEFAULT 'Unknown',
    ua String DEFAULT 'Unknown',
    bot UInt8 DEFAULT 0,
    referer String DEFAULT '(direct)',
    referer_url String DEFAULT '(direct)',
    user_id Nullable(Int64),
    identity_hash Nullable(String),
    ip String DEFAULT '',
    qr UInt8 DEFAULT 0,
    continent LowCardinality(String) DEFAULT '',
    vercel_region Nullable(String),
    trigger String DEFAULT 'link',
    workspace_id Nullable(String),
    domain Nullable(String),
    key Nullable(String)
)
ENGINE = MergeTree
ORDER BY (click_id);

-- MV: click_events → click_events_id
CREATE MATERIALIZED VIEW IF NOT EXISTS dub.dub_click_events_to_id_mv
TO dub.dub_click_events_id AS
SELECT * FROM dub.dub_click_events;

-- ---- Click Events MV (workspace/link optimized) ----
CREATE TABLE IF NOT EXISTS dub.dub_click_events_mv
(
    timestamp DateTime64(3),
    click_id String,
    link_id String,
    alias_link_id Nullable(String),
    url String,
    country LowCardinality(String) DEFAULT 'Unknown',
    city String DEFAULT 'Unknown',
    region String DEFAULT 'Unknown',
    latitude String DEFAULT 'Unknown',
    longitude String DEFAULT 'Unknown',
    device LowCardinality(String) DEFAULT 'Desktop',
    device_model LowCardinality(String) DEFAULT 'Unknown',
    device_vendor LowCardinality(String) DEFAULT 'Unknown',
    browser LowCardinality(String) DEFAULT 'Unknown',
    browser_version String DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    os_version String DEFAULT 'Unknown',
    engine LowCardinality(String) DEFAULT 'Unknown',
    engine_version String DEFAULT 'Unknown',
    cpu_architecture LowCardinality(String) DEFAULT 'Unknown',
    ua String DEFAULT 'Unknown',
    bot UInt8 DEFAULT 0,
    referer String DEFAULT '(direct)',
    referer_url String DEFAULT '(direct)',
    user_id Nullable(Int64),
    identity_hash Nullable(String),
    ip String DEFAULT '',
    qr UInt8 DEFAULT 0,
    continent LowCardinality(String) DEFAULT '',
    vercel_region Nullable(String),
    trigger String DEFAULT 'link',
    workspace_id Nullable(String),
    domain Nullable(String),
    key Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (workspace_id, link_id, timestamp);

-- MV: click_events → click_events_mv
CREATE MATERIALIZED VIEW IF NOT EXISTS dub.dub_click_events_to_mv
TO dub.dub_click_events_mv AS
SELECT * FROM dub.dub_click_events;

-- ---- Lead Events ----
CREATE TABLE IF NOT EXISTS dub.dub_lead_events
(
    timestamp DateTime64(3),
    event_id String,
    event_name String DEFAULT '',
    customer_id String,
    click_id String DEFAULT '',
    link_id String DEFAULT '',
    url String DEFAULT '',
    continent LowCardinality(String) DEFAULT '',
    country LowCardinality(String) DEFAULT 'Unknown',
    city String DEFAULT 'Unknown',
    region String DEFAULT 'Unknown',
    latitude String DEFAULT 'Unknown',
    longitude String DEFAULT 'Unknown',
    device LowCardinality(String) DEFAULT 'Desktop',
    device_model LowCardinality(String) DEFAULT 'Unknown',
    device_vendor LowCardinality(String) DEFAULT 'Unknown',
    browser LowCardinality(String) DEFAULT 'Unknown',
    browser_version String DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    os_version String DEFAULT 'Unknown',
    engine LowCardinality(String) DEFAULT 'Unknown',
    engine_version String DEFAULT 'Unknown',
    cpu_architecture LowCardinality(String) DEFAULT 'Unknown',
    ua String DEFAULT 'Unknown',
    bot UInt8 DEFAULT 0,
    referer String DEFAULT '(direct)',
    referer_url String DEFAULT '(direct)',
    ip String DEFAULT '',
    qr UInt8 DEFAULT 0,
    metadata String DEFAULT '',
    trigger String DEFAULT '',
    domain Nullable(String),
    key Nullable(String),
    workspace_id Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, link_id, customer_id);

CREATE TABLE IF NOT EXISTS dub.dub_lead_events_mv
(
    timestamp DateTime64(3),
    event_id String,
    event_name String DEFAULT '',
    customer_id String,
    click_id String DEFAULT '',
    link_id String DEFAULT '',
    url String DEFAULT '',
    continent LowCardinality(String) DEFAULT '',
    country LowCardinality(String) DEFAULT 'Unknown',
    city String DEFAULT 'Unknown',
    region String DEFAULT 'Unknown',
    latitude String DEFAULT 'Unknown',
    longitude String DEFAULT 'Unknown',
    device LowCardinality(String) DEFAULT 'Desktop',
    device_model LowCardinality(String) DEFAULT 'Unknown',
    device_vendor LowCardinality(String) DEFAULT 'Unknown',
    browser LowCardinality(String) DEFAULT 'Unknown',
    browser_version String DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    os_version String DEFAULT 'Unknown',
    engine LowCardinality(String) DEFAULT 'Unknown',
    engine_version String DEFAULT 'Unknown',
    cpu_architecture LowCardinality(String) DEFAULT 'Unknown',
    ua String DEFAULT 'Unknown',
    bot UInt8 DEFAULT 0,
    referer String DEFAULT '(direct)',
    referer_url String DEFAULT '(direct)',
    ip String DEFAULT '',
    qr UInt8 DEFAULT 0,
    metadata String DEFAULT '',
    trigger String DEFAULT '',
    domain Nullable(String),
    key Nullable(String),
    workspace_id Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (workspace_id, link_id, timestamp);

CREATE MATERIALIZED VIEW IF NOT EXISTS dub.dub_lead_events_to_mv
TO dub.dub_lead_events_mv AS
SELECT * FROM dub.dub_lead_events;

-- ---- Sale Events ----
CREATE TABLE IF NOT EXISTS dub.dub_sale_events
(
    timestamp DateTime64(3),
    event_id String,
    event_name String DEFAULT '',
    customer_id String,
    payment_processor LowCardinality(String) DEFAULT '',
    invoice_id String DEFAULT '',
    amount UInt32 DEFAULT 0,
    currency LowCardinality(String) DEFAULT 'usd',
    click_id String DEFAULT '',
    link_id String DEFAULT '',
    url String DEFAULT '',
    continent LowCardinality(String) DEFAULT '',
    country LowCardinality(String) DEFAULT 'Unknown',
    city String DEFAULT 'Unknown',
    region String DEFAULT 'Unknown',
    latitude String DEFAULT 'Unknown',
    longitude String DEFAULT 'Unknown',
    device LowCardinality(String) DEFAULT 'Desktop',
    device_model LowCardinality(String) DEFAULT 'Unknown',
    device_vendor LowCardinality(String) DEFAULT 'Unknown',
    browser LowCardinality(String) DEFAULT 'Unknown',
    browser_version String DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    os_version String DEFAULT 'Unknown',
    engine LowCardinality(String) DEFAULT 'Unknown',
    engine_version String DEFAULT 'Unknown',
    cpu_architecture LowCardinality(String) DEFAULT 'Unknown',
    ua String DEFAULT 'Unknown',
    bot UInt8 DEFAULT 0,
    referer String DEFAULT '(direct)',
    referer_url String DEFAULT '(direct)',
    ip String DEFAULT '',
    qr UInt8 DEFAULT 0,
    metadata String DEFAULT '',
    trigger String DEFAULT '',
    domain Nullable(String),
    key Nullable(String),
    workspace_id Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, link_id);

CREATE TABLE IF NOT EXISTS dub.dub_sale_events_mv
(
    timestamp DateTime64(3),
    event_id String,
    event_name String DEFAULT '',
    customer_id String,
    payment_processor LowCardinality(String) DEFAULT '',
    invoice_id String DEFAULT '',
    amount UInt32 DEFAULT 0,
    currency LowCardinality(String) DEFAULT 'usd',
    click_id String DEFAULT '',
    link_id String DEFAULT '',
    url String DEFAULT '',
    continent LowCardinality(String) DEFAULT '',
    country LowCardinality(String) DEFAULT 'Unknown',
    city String DEFAULT 'Unknown',
    region String DEFAULT 'Unknown',
    latitude String DEFAULT 'Unknown',
    longitude String DEFAULT 'Unknown',
    device LowCardinality(String) DEFAULT 'Desktop',
    device_model LowCardinality(String) DEFAULT 'Unknown',
    device_vendor LowCardinality(String) DEFAULT 'Unknown',
    browser LowCardinality(String) DEFAULT 'Unknown',
    browser_version String DEFAULT 'Unknown',
    os LowCardinality(String) DEFAULT 'Unknown',
    os_version String DEFAULT 'Unknown',
    engine LowCardinality(String) DEFAULT 'Unknown',
    engine_version String DEFAULT 'Unknown',
    cpu_architecture LowCardinality(String) DEFAULT 'Unknown',
    ua String DEFAULT 'Unknown',
    bot UInt8 DEFAULT 0,
    referer String DEFAULT '(direct)',
    referer_url String DEFAULT '(direct)',
    ip String DEFAULT '',
    qr UInt8 DEFAULT 0,
    metadata String DEFAULT '',
    trigger String DEFAULT '',
    domain Nullable(String),
    key Nullable(String),
    workspace_id Nullable(String)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (workspace_id, link_id, timestamp);

CREATE MATERIALIZED VIEW IF NOT EXISTS dub.dub_sale_events_to_mv
TO dub.dub_sale_events_mv AS
SELECT * FROM dub.dub_sale_events;

-- ---- Links Metadata ----
CREATE TABLE IF NOT EXISTS dub.dub_links_metadata
(
    timestamp DateTime DEFAULT now(),
    link_id String,
    domain String DEFAULT '',
    key String DEFAULT '',
    url String DEFAULT '',
    tag_ids Array(String) DEFAULT [],
    workspace_id String DEFAULT '',
    created_at DateTime64(3) DEFAULT now(),
    deleted UInt8 DEFAULT 0,
    program_id String DEFAULT '',
    tenant_id String DEFAULT '',
    partner_id String DEFAULT '',
    folder_id String DEFAULT '',
    partner_group_id String DEFAULT '',
    partner_tag_ids Array(String) DEFAULT []
)
ENGINE = MergeTree
PARTITION BY toYear(timestamp)
ORDER BY (timestamp, link_id, workspace_id);

CREATE TABLE IF NOT EXISTS dub.dub_links_metadata_latest
(
    timestamp DateTime DEFAULT now(),
    link_id String,
    domain String DEFAULT '',
    key String DEFAULT '',
    url String DEFAULT '',
    tag_ids Array(String) DEFAULT [],
    workspace_id String DEFAULT '',
    created_at DateTime64(3) DEFAULT now(),
    deleted UInt8 DEFAULT 0,
    program_id String DEFAULT '',
    tenant_id String DEFAULT '',
    partner_id String DEFAULT '',
    folder_id String DEFAULT '',
    partner_group_id String DEFAULT '',
    partner_tag_ids Array(String) DEFAULT []
)
ENGINE = ReplacingMergeTree(timestamp)
ORDER BY (workspace_id, link_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS dub.dub_links_metadata_to_latest_mv
TO dub.dub_links_metadata_latest AS
SELECT * FROM dub.dub_links_metadata;

-- ---- Webhook Events ----
CREATE TABLE IF NOT EXISTS dub.dub_webhook_events
(
    timestamp DateTime64(3) DEFAULT now64(3),
    event_id String,
    webhook_id String,
    url String DEFAULT '',
    event LowCardinality(String) DEFAULT '',
    http_status UInt16 DEFAULT 0,
    request_body String DEFAULT '',
    response_body String DEFAULT '',
    message_id String DEFAULT ''
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, webhook_id, event_id);

-- ---- Postback Events ----
CREATE TABLE IF NOT EXISTS dub.dub_postback_events
(
    timestamp DateTime64(3) DEFAULT now64(3),
    event_id String,
    postback_id String,
    url String DEFAULT '',
    event LowCardinality(String) DEFAULT '',
    response_status UInt16 DEFAULT 0,
    request_body String DEFAULT '',
    response_body String DEFAULT '',
    message_id String DEFAULT '',
    retry_attempt UInt8 DEFAULT 0
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (postback_id, event_id, timestamp);

-- ---- Import Error Logs ----
CREATE TABLE IF NOT EXISTS dub.dub_import_error_logs
(
    timestamp DateTime64(3) DEFAULT now64(3),
    workspace_id String,
    import_id String,
    source String DEFAULT '',
    entity String DEFAULT '',
    entity_id String DEFAULT '',
    code String DEFAULT '',
    message String DEFAULT ''
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, workspace_id, import_id)
TTL toDateTime(timestamp) + INTERVAL 180 DAY;

-- ---- Audit Logs ----
CREATE TABLE IF NOT EXISTS dub.dub_audit_logs
(
    id String,
    timestamp DateTime64(3) DEFAULT now64(3),
    workspace_id String DEFAULT '',
    program_id String DEFAULT '',
    action LowCardinality(String) DEFAULT '',
    actor_id String DEFAULT '',
    actor_type LowCardinality(String) DEFAULT '',
    actor_name String DEFAULT '',
    targets String DEFAULT '',
    description String DEFAULT '',
    ip_address String DEFAULT '',
    user_agent String DEFAULT '',
    metadata String DEFAULT ''
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (workspace_id, program_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 365 DAY;

-- ---- API Logs ----
CREATE TABLE IF NOT EXISTS dub.dub_api_logs
(
    id String,
    timestamp DateTime64(3) DEFAULT now64(3),
    workspace_id String DEFAULT '',
    method LowCardinality(String) DEFAULT '',
    path String DEFAULT '',
    route_pattern LowCardinality(String) DEFAULT '',
    status_code UInt16 DEFAULT 0,
    duration UInt32 DEFAULT 0,
    user_agent String DEFAULT '',
    request_body String DEFAULT '',
    response_body String DEFAULT '',
    token_id String DEFAULT '',
    user_id String DEFAULT '',
    request_type LowCardinality(String) DEFAULT ''
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (workspace_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 90 DAY;

CREATE TABLE IF NOT EXISTS dub.dub_api_logs_id
(
    id String,
    timestamp DateTime64(3) DEFAULT now64(3),
    workspace_id String DEFAULT '',
    method LowCardinality(String) DEFAULT '',
    path String DEFAULT '',
    route_pattern LowCardinality(String) DEFAULT '',
    status_code UInt16 DEFAULT 0,
    duration UInt32 DEFAULT 0,
    user_agent String DEFAULT '',
    request_body String DEFAULT '',
    response_body String DEFAULT '',
    token_id String DEFAULT '',
    user_id String DEFAULT '',
    request_type LowCardinality(String) DEFAULT ''
)
ENGINE = MergeTree
ORDER BY (id)
TTL toDateTime(timestamp) + INTERVAL 90 DAY;

CREATE MATERIALIZED VIEW IF NOT EXISTS dub.dub_api_logs_to_id_mv
TO dub.dub_api_logs_id AS
SELECT * FROM dub.dub_api_logs;

-- ---- Conversion Events Log ----
CREATE TABLE IF NOT EXISTS dub.dub_conversion_events_log
(
    timestamp DateTime64(3) DEFAULT now64(3),
    workspace_id String DEFAULT '',
    link_id String DEFAULT '',
    path String DEFAULT '',
    body String DEFAULT '',
    error String DEFAULT ''
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, workspace_id)
TTL toDateTime(timestamp) + INTERVAL 90 DAY;
