const { Pool } = require('pg');
const schemaSql = require('./schema-postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
}

// Supabase (and most managed Postgres) require TLS. Local dev Postgres usually
// does not, so only enable SSL when the host is not local.
function shouldUseSsl(url) {
  if (process.env.PGSSLMODE === 'disable') return false;
  try {
    const host = new URL(url).hostname;
    return !['localhost', '127.0.0.1', '::1'].includes(host);
  } catch {
    return true;
  }
}

const pool = new Pool({
  connectionString,
  ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Translate the SQLite dialect used throughout the app into PostgreSQL.
 * Keeping this in one place means route code stays dialect-agnostic.
 */
function toPgSql(sql) {
  let out = sql;

  // datetime('now') / CURRENT_TIMESTAMP -> NOW()
  out = out.replace(/datetime\(\s*'now'\s*\)/gi, 'NOW()');

  // Positional ? -> $1, $2, ... (ignoring ? inside string literals)
  let index = 0;
  out = out.replace(/'[^']*'|\?/g, (match) => (match === '?' ? `$${++index}` : match));

  return out;
}

// Booleans are handled by route-level helpers; no-op coercion removed.

/**
 * Normalise a returned row so callers see the same shapes as better-sqlite3:
 *  - booleans come back as 0/1 integers
 *  - NUMERIC columns come back as numbers rather than strings
 */
const NUMERIC_FIELDS = new Set([
  'marks', 'negative_marks', 'marks_awarded', 'total_marks',
]);
const BOOLEAN_FIELDS = new Set(['is_active', 'is_correct', 'feedback_enabled']);
const COUNT_FIELDS = new Set(['c', 'count', 'correct_count', 'incorrect_count', 'unanswered_count']);

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  for (const key of Object.keys(row)) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    if (BOOLEAN_FIELDS.has(key) && typeof value === 'boolean') {
      row[key] = value ? 1 : 0;
    } else if ((NUMERIC_FIELDS.has(key) || COUNT_FIELDS.has(key)) && typeof value === 'string') {
      const n = Number(value);
      if (!Number.isNaN(n)) row[key] = n;
    } else if (value instanceof Date) {
      row[key] = value.toISOString();
    }
  }
  return row;
}

const db = {
  dialect: 'postgres',

  prepare(sql) {
    const pgSql = toPgSql(sql);
    const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
    // better-sqlite3 exposes lastInsertRowid; emulate it with RETURNING id.
    const runSql = isInsert && !/RETURNING/i.test(pgSql) ? `${pgSql} RETURNING id` : pgSql;

    return {
      async run(...params) {
        const res = await pool.query(runSql, params);
        const firstRow = res.rows && res.rows[0];
        return {
          changes: res.rowCount,
          lastInsertRowid: firstRow && firstRow.id !== undefined ? firstRow.id : undefined,
        };
      },
      async get(...params) {
        const res = await pool.query(pgSql, params);
        return res.rows.length ? normalizeRow(res.rows[0]) : undefined;
      },
      async all(...params) {
        const res = await pool.query(pgSql, params);
        return res.rows.map(normalizeRow);
      },
    };
  },

  async exec(sql) {
    await pool.query(sql);
  },

  /** Create tables if they do not exist yet (idempotent). */
  async init() {
    await pool.query(schemaSql);
  },

  async close() {
    await pool.end();
  },
};

module.exports = db;
