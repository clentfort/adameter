# TinyBase migrations

This directory contains append-only schema/data migrations.

## Rules

1. **One file per migration**, named with date prefix:
   - `YYYY-MM-DD-short-description.ts`
2. **Register it in `src/migrations/index.ts`** in chronological order.
3. **Add its id to `src/migrations/manifest.ts`** in chronological order.
   - This manifest is used for a lightweight startup fast-path and lazy loading.
4. **Copy type snapshots into migration files** so the migration remains
   understandable even if app types evolve.
5. **Migrations must be idempotent** and multiplayer-safe.
   - Multiple devices can run the same migration before sync metadata converges.
6. **Migrations must be deterministic**: the same input data must produce the
   same output on every device.
   - Don't generate random IDs or derive values from the current time or device.
     Two devices running the migration concurrently would otherwise create
     duplicates that both survive the merge (see
     `2026-06-05-consolidate-duplicate-profiles`).
   - Derive new IDs from existing data instead (e.g. from the source row ID).
7. **Old app versions can write old-format data after a migration is marked
   applied.** The `_migrations` row is synced, so other devices won't rerun the
   migration for those rows.
   - If a migration's format must hold for all rows, add an idempotent repair
     that runs after every merge (like `repairMissingProfileIds`).

## Metadata tracking

Applied migrations are stored in TinyBase table `_migrations`
(`INTERNAL_TABLE_IDS.MIGRATIONS`), keyed by migration id.

Each row stores:

- `appliedAt`
- `appliedByDeviceId` (if available)
- `description`

## Startup behavior

Migrations and repairs run:

1. after the local IndexedDB load, in `TinybaseProvider`
2. after every pull of changed cells from the room, in `startRoomSync`
   (`src/lib/tinybase-sync/room-sync.ts`)

Migration code is loaded lazily only when pending migrations are detected. If
the latest migration id is already present in `_migrations`, startup skips
loading the migration module.

The app stays on the splash screen until the first run is complete. Syncing
happens in the background afterwards, so merged remote data can briefly be
visible before the second run finishes. Changes received as WebSocket broadcasts
are not migrated until the next pull.

Migrations run on the local store only. The migrated cells are then uploaded
like any other local change, with `_migrations` cells last, so a device that
pulls a partial upload runs the migration itself rather than trusting a marker
whose rows have not arrived yet.
