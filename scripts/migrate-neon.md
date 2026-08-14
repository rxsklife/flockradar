# Migrating to Neon (PostGIS)

## 1. Create the Neon project
1. Sign up at https://neon.tech (free tier: 0.5GB storage — plenty for ~3.6k entities).
2. Create a project (any region). Note the connection string:
   `postgresql://[user]:[password]@[host].neon.tech/[dbname]?sslmode=require`
3. **Enable PostGIS** in your new database:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
   (Neon supports PostGIS; the extension must exist before restoring the dump.)

## 2. Dump the local database
Already done — `flockradar.dump` at the repo root (custom format, `pg_dump -Fc`).
Recreate it anytime with:
```bash
docker exec flockradar-db pg_dump -U flockradar -Fc flockradar -f /tmp/flockradar.dump
docker cp flockradar-db:/tmp/flockradar.dump ./flockradar.dump
```

## 3. Restore into Neon
```bash
# psql/pg_restore on PATH (or `npx pg-essentials`, or use Neon's own SQL editor
# for schema-only; data restore needs pg_restore)
pg_restore --no-owner --no-privileges -d "postgresql://[user]:***@[host].neon.tech/[dbname]?sslmode=require" flockradar.dump
```
`--no-owner --no-privileges` are required — Neon doesn't grant superuser.

## 4. Verify
```bash
psql "<neon-url>" -c "select count(*) from entities;"
# expect 3584 (or current count)
psql "<neon-url>" -c "select postgis_version();"
```

## 5. Point the app at it
- Local: `DATABASE_URL=<neon-url>` in `.env.local` (or keep local Docker for dev).
- Vercel: add `DATABASE_URL` to Project → Settings → Environment Variables.
- GitHub Actions: add `DATABASE_URL` to repo → Settings → Secrets and variables → Actions
  (used by the nightly re-verify flag + daily lead scanner).

## Notes
- Drizzle migrations are versioned in `drizzle/`; `npm run db:migrate` applies them
  against whatever `DATABASE_URL` points at (Neon included).
- The dump is gitignored — it's a migration artifact, not the dataset home.
- Scheduled tasks do NOT run inside Neon on the free tier; the GitHub Actions
  workflows in `.github/workflows/` handle feed warmup, lead scanning, and
  re-verify flags (they need the repo secrets above).
