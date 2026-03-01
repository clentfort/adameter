# TinyBase migrations

This directory contains append-only schema/data migrations.

## Rules

1. **One file per migration**, named with date prefix:
   - `YYYY-MM-DD-short-description.ts`
2. **Register it in `src/migrations/index.ts`** in chronological order.
3. **Copy type snapshots into migration files** so the migration remains
   understandable even if app types evolve.
4. **Migrations must be idempotent** and multiplayer-safe.
   - Multiple devices can run the same migration before sync metadata converges.

## Metadata tracking

Applied migrations are stored in TinyBase table `_migrations`
(`INTERNAL_TABLE_IDS.MIGRATIONS`), keyed by migration id.

Each row stores:

- `appliedAt`
- `appliedByDeviceId` (if available)
- `description`

## Startup behavior

`TinybaseProvider` runs migrations:

1. after local IndexedDB load
2. again after PartyKit bootstrap/merge (if syncing)

The app stays on splash screen until this process is complete, so UI code does
not run against unmigrated data.
