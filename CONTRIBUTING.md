# Contributing to FlockRadar

Thank you for helping make ALPR deployments visible! There are three ways to contribute: **data**, **research**, and **code**.

## Data contributions

Have a public record about an ALPR/Flock deployment?

1. Use the [Submit a Tip form](https://flockradar.com/submit) on the site — or open a PR adding to `src/db/seed.ts`.
2. Include the source URL. **No source, no entry** — this is non-negotiable.
3. Wait for review. Submissions are never auto-published; a researcher verifies every record.

### What we accept

- Government-published camera locations
- Locations disclosed in council packets, contracts, policy documents, or agency maps
- Public contracts and procurement records
- Official announcements and meeting minutes
- Verified community submissions with corroborating evidence
- Entity-level records ("City of X operates a Flock program") even without exact camera locations

### What we never accept

- Live camera feeds or system-access information
- Credentials, leaked material, or private datasets
- Individually identifying vehicle/plate data
- Locations inferred solely from observation, imagery, or rumor
- Instructions to damage, disable, bypass, evade, or interfere with cameras
- Names, addresses, or PII of private residents who submit information

## Research contributions

- Help re-verify records (check the "last verified" date, refresh stale sources)
- Cover a new jurisdiction using the [per-jurisdiction search checklist](https://github.com/rxsklife/flockradar/blob/main/plan.md)
- Flag outdated or incorrect entries via the correction form

## Code contributions

### Setup

```bash
npm install
cp .env.local.example .env.local   # add your DATABASE_URL
npx drizzle-kit generate && DATABASE_URL=... npx drizzle-kit migrate
npm run dev
```

### Workflow

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make changes with tests where practical.
3. Run checks:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
4. Open a PR against `main` with a clear description of what and why.

### Conventions

- TypeScript everywhere; no `any` unless unavoidable (and then commented).
- Zod schemas for all external input.
- Follow the publishing policy in every feature — the project's integrity is its value.
- Keep the changelog honest: any code that changes published data should write a `logChange` entry.

## Code of conduct

Be respectful. This project documents public records about public infrastructure; it does not host harassment, doxxing, or instructions to interfere with equipment. We reserve the right to remove contributions that violate the publishing policy.

## Questions

Open an issue or use the correction form on the site. For anything sensitive (e.g., a record that may contain personal data), email the maintainer directly rather than filing a public issue.
