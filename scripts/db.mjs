// scripts/db.mjs
//
// Run SQL against the Supabase database (session pooler) for migrations.
//
// Usage:
//   node scripts/db.mjs query "<sql>"                 run a statement, print rows
//   node scripts/db.mjs dry-run <file.sql>            run a migration, then ROLL BACK
//   node scripts/db.mjs apply <file.sql>              run a migration and COMMIT
//
// Migrations run inside one transaction, so a failure changes nothing.
// Reads SUPABASE_DB_URL (session pooler URI, port 5432) from .env.local.

import { readFileSync } from 'node:fs'
import pg from 'pg'

function env(key) {
  if (process.env[key]) return process.env[key]
  try {
    const line = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${key}=`))
    return line?.slice(key.length + 1).trim()
  } catch {
    return undefined
  }
}

const [cmd, arg] = process.argv.slice(2)
if (!['query', 'dry-run', 'apply'].includes(cmd) || !arg) {
  console.error('Usage: node scripts/db.mjs query "<sql>" | dry-run <file.sql> | apply <file.sql>')
  process.exit(1)
}

const url = env('SUPABASE_DB_URL')
if (!url) {
  console.error('SUPABASE_DB_URL is not set in .env.local')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  if (cmd === 'query') {
    const res = await client.query(arg)
    const results = Array.isArray(res) ? res : [res]
    for (const r of results) {
      if (r.rows?.length) console.table(r.rows)
      else console.log(`${r.command ?? 'OK'}${r.rowCount != null ? ` (${r.rowCount} rows)` : ''}`)
    }
  } else {
    const sql = readFileSync(arg, 'utf8')
    await client.query('BEGIN')
    try {
      await client.query(sql)
      if (cmd === 'apply') {
        await client.query('COMMIT')
        console.log(`Applied ${arg}`)
      } else {
        await client.query('ROLLBACK')
        console.log(`Dry run OK (rolled back): ${arg}`)
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }
} catch (err) {
  console.error(`Error: ${err.message}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
