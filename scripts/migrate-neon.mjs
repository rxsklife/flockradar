import postgres from 'postgres';
import { readFileSync } from 'node:fs';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

for (const f of ['drizzle/0004_empty_vector.sql', 'drizzle/0005_dear_bruce_banner.sql']) {
  const stmts = readFileSync(f, 'utf-8')
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of stmts) {
    await sql.unsafe(stmt);
  }
  console.log('applied', f);
}

const t = await sql`select table_name from information_schema.tables where table_name in ('abuse_cases', 'leads')`;
console.log('tables:', t.map((r) => r.table_name).join(', '));

await sql.end();
