/**
 * Self-hosted Redis compatibility layer.
 * Wraps ioredis to provide an API compatible with @upstash/redis.
 * Key difference: auto JSON serialize/deserialize like Upstash does.
 */
import Redis from "ioredis";

function createIoRedisClient(): Redis {
  const url = process.env.REDIS_URL;
  if (url) {
    return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
  }
  return new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}

function serialize(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function deserialize<T>(value: string | null): T | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

class UpstashCompatPipeline {
  private commands: Array<{ method: string; args: any[] }> = [];
  private client: Redis;

  constructor(client: Redis) {
    this.client = client;
  }

  get(...args: any[]) {
    this.commands.push({ method: "get", args });
    return this;
  }

  set(...args: any[]) {
    this.commands.push({ method: "set", args });
    return this;
  }

  del(...args: any[]) {
    this.commands.push({ method: "del", args });
    return this;
  }

  incr(...args: any[]) {
    this.commands.push({ method: "incr", args });
    return this;
  }

  expire(...args: any[]) {
    this.commands.push({ method: "expire", args });
    return this;
  }

  hset(key: string, field: string, value: any) {
    this.commands.push({ method: "hset", args: [key, field, serialize(value)] });
    return this;
  }

  hget(...args: any[]) {
    this.commands.push({ method: "hget", args });
    return this;
  }

  sadd(...args: any[]) {
    this.commands.push({ method: "sadd", args });
    return this;
  }

  srem(...args: any[]) {
    this.commands.push({ method: "srem", args });
    return this;
  }

  async exec(): Promise<any[]> {
    const pipe = this.client.pipeline();
    for (const cmd of this.commands) {
      (pipe as any)[cmd.method](...cmd.args);
    }
    const results = await pipe.exec();
    if (!results) return [];
    return results.map(([err, val]) => {
      if (err) return null;
      if (typeof val === "string") return deserialize(val);
      return val;
    });
  }
}

/**
 * Upstash-compatible Redis wrapper around ioredis.
 */
export class UpstashCompatRedis {
  private client: Redis;

  constructor(client?: Redis) {
    this.client = client || createIoRedisClient();
  }

  async get<T = any>(key: string): Promise<T | null> {
    const val = await this.client.get(key);
    return deserialize<T>(val);
  }

  async set(key: string, value: any, opts?: { ex?: number }): Promise<"OK"> {
    const serialized = serialize(value);
    if (opts?.ex) {
      await this.client.set(key, serialized, "EX", opts.ex);
    } else {
      await this.client.set(key, serialized);
    }
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return await this.client.del(...keys);
  }

  async mget<T = any>(...args: any[]): Promise<(T | null)[]> {
    const keys = args.flat();
    if (keys.length === 0) return [];
    const values = await this.client.mget(...keys);
    return values.map((v) => deserialize<T>(v));
  }

  async mset(data: Record<string, any>): Promise<"OK"> {
    const pairs: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      pairs.push(k, serialize(v));
    }
    if (pairs.length > 0) {
      await this.client.mset(...pairs);
    }
    return "OK";
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const val = await this.client.hget(key, field);
    return deserialize<T>(val);
  }

  async hset(key: string, field: string, value: any): Promise<number> {
    return await this.client.hset(key, field, serialize(value));
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return await this.client.hdel(key, ...fields);
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T> | null> {
    const val = await this.client.hgetall(key);
    if (!val || Object.keys(val).length === 0) return null;
    const result: Record<string, T> = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = deserialize<T>(v) as T;
    }
    return result;
  }

  async sadd(key: string, ...members: any[]): Promise<number> {
    const serialized = members.map(serialize);
    return await this.client.sadd(key, ...serialized);
  }

  async srem(key: string, ...members: any[]): Promise<number> {
    const serialized = members.map(serialize);
    return await this.client.srem(key, ...serialized);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async sismember(key: string, member: any): Promise<0 | 1> {
    const result = await this.client.sismember(key, serialize(member));
    return result as 0 | 1;
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async incrby(key: string, increment: number): Promise<number> {
    return await this.client.incrby(key, increment);
  }

  async expire(key: string, seconds: number): Promise<0 | 1> {
    const result = await this.client.expire(key, seconds);
    return result as 0 | 1;
  }

  async exists(...keys: string[]): Promise<number> {
    return await this.client.exists(...keys);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async scan(cursor: number, opts?: { match?: string; count?: number }) {
    const args: any[] = [cursor];
    if (opts?.match) args.push("MATCH", opts.match);
    if (opts?.count) args.push("COUNT", opts.count);
    const [newCursor, keys] = await this.client.scan(...args);
    return [parseInt(newCursor as string), keys as string[]];
  }

  async xadd(key: string, id: string, ...args: any[]) {
    return await this.client.xadd(key, id, ...args);
  }

  async xread(...args: any[]) {
    return await (this.client as any).xread(...args);
  }

  pipeline(): UpstashCompatPipeline {
    return new UpstashCompatPipeline(this.client);
  }

  // For compatibility where code passes the redis instance to rate limiter
  get _ioredisClient(): Redis {
    return this.client;
  }
}

// Create singleton instances
const mainClient = createIoRedisClient();
export const redis = new UpstashCompatRedis(mainClient);
export const redisGlobal = new UpstashCompatRedis(createIoRedisClient());
export const redisGlobalWithTimeout = new UpstashCompatRedis(
  createIoRedisClient(),
);
