/**
 * Self-hosted MySQL connection.
 * Replaces @planetscale/database with mysql2 for direct MySQL connections.
 * Provides the same conn.execute() API.
 */
import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }
  return pool;
}

/**
 * PlanetScale-compatible connection interface.
 * conn.execute(query, params) returns { rows, headers, size, ... }
 */
export const conn = {
  async execute(
    query: string,
    params?: any[],
  ): Promise<{ rows: any[]; headers: any[]; size: number }> {
    const p = getPool();
    const [rows, fields] = await p.execute(query, params);
    const resultRows = Array.isArray(rows) ? rows : [];
    return {
      rows: resultRows,
      headers: fields
        ? (fields as any[]).map((f: any) => ({ name: f.name, type: f.type }))
        : [],
      size: resultRows.length,
    };
  },
};
