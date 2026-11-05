# Plan: sync with per-cell encryption

Status: Plan B implemented on `feat/offline-first` (PR #1526), not deployed.
Builds on `feat/offline-first`.

Implementation notes (where it differs from or adds to the plan below):

- AAD is the JSON array `[kind, table, row, cell, hlc]`, so IDs containing `|`
  cannot collide. The IV is an HMAC over the AAD and the plaintext, so it stays
  deterministic but two different plaintexts can never share an IV.
- The server's metadata table is `cell_meta` (not `meta`). `POST /cells` returns
  the accepted sequence range, so an uploader whose range directly follows its
  last pull advances `lastSeq` and does not pull its own cells.
- The last pulled sequence number, the server epoch and the legacy snapshot ETag
  are device-local values of the store (`_local:` prefix, never uploaded, never
  exported), not part of the separate sync state. They are written in the same
  persister save as the cells they cover, so a failed save, a cleared database
  or another tab saving older content can only cause a re-pull, never a skipped
  cell. The separate sync state only holds server stamps, which stay true
  whatever happens to the store.
- Every cells response carries a room epoch (random ID created with the room's
  cells). A changed epoch, a head below the client's `lastSeq`, or an empty
  server while the client has stamps resets the client's sync state (stamps
  first) and re-uploads everything.
- Cells are applied only as far as the store accepts them (checked on a scratch
  store, since TinyBase ignores a whole change set with one HLC more than 5
  minutes ahead). The pull position stops before cells that wait for a clock
  that is behind, and before undecryptable cells (retried three times per
  session, then skipped). A different ciphertext for the same HLC replaces a
  stored cell on the server, so a good copy can repair a broken one.
- Pages are limited to 1,000 cells and 2 MiB of ciphertext and carry a `more`
  flag. A failed send to one socket does not stop a broadcast.
- Factory reset and "Clear & Join" switch to a new local database (and a new
  local store ID for the sync state) and reload, instead of clearing the shared
  database that other tabs could write back. Other tabs reload via a
  BroadcastChannel; databases of earlier resets are deleted at startup.
- Cells the server rejects (422) are kept locally, retried after 5 minutes or
  when they change, and shown as a new `error` sync status meanwhile.
- A failing legacy `/store` read never holds back uploads and is retried after a
  minute, as are pulls that stopped early.

Structure: **Phase 0** checks whether TinyBase's own sync stack can be used with
encrypted cells. If it passes, implement **Plan A** (TinyBase stock sync with an
encrypted mirror store). If it fails, implement **Plan B** (hand-rolled per-cell
server merge). The sections after Plan B apply to both.

## Goal

Replace the encrypted full-snapshot sync (and today's custom encrypted TinyBase
synchronizer) so that:

- a change costs one small upload, independent of the number of devices;
- online devices receive changes without extra requests;
- a device that was offline only exchanges what changed;
- there is no version-conflict path, no compaction and no snapshot chunking.

Core principles, in the operator's words: "we cant know our users data, we dont
track, we dont lose data, we are mobile first, we work offline." The operator
accepted that the server sees the data's structure (see Privacy).

Decided by the operator:

- No peer-to-peer model ("a peer-to-peer model doesnt make a lot of sense for
  the app anyway"); the relay/server is the sync partner of every device.
- The server may be changed freely.
- One encrypted value per cell (not per row).
- Encryption key derivation (room name → key) stays as is; out of scope.

## Background

A TinyBase `MergeableStore` is a set of cells and values, each with an HLC
timestamp. Merging keeps the value with the larger timestamp per cell. HLCs are
sortable 16-character strings (`node_modules/tinybase/@types/common`). Deletions
are cells/values set to `undefined` with their own timestamp
(`CellStamp = Stamp<CellOrUndefined>`), so they are ordinary cells.

If cell values are ciphertext but IDs and HLCs stay readable, any party can
merge without reading values. Both plans rely on this.

## Current state (for orientation)

- Server:
  `packages/tinybase-synchronizer-partykit-server-encrypted/src/relay-server.ts`,
  a PartyServer `Server` on a SQLite-backed Durable Object (class `Tinybase`,
  `party/main.ts`, `wrangler.jsonc`). `GET/PUT /store` with `ETag`/`If-Match`;
  WebSocket relay `<toClientId>\n<ciphertext>`.
- Client package:
  `packages/tinybase-synchronizer-partykit-client-encrypted/src/`
  (`synchronizer.ts`, `crypto.ts`: AES-GCM with random IV, key and room hash
  derived from the room name).
- App: `src/lib/tinybase-sync/room-sync.ts` (sync loop, backoff, status),
  `src/contexts/tinybase-context.tsx` (store created with
  `createMergeableStore()` without a stable unique ID, IndexedDB persister),
  `src/lib/tinybase-sync/factory-reset.ts`, `src/lib/tinybase-sync/cloning.ts`
  (reads `/store` of another room), `src/migrations/`.
- E2E relay helper: `tests/helpers/relay.ts` (matches `/store` requests, routes
  `ws://localhost:1999/`).

## Shared building block: per-cell encryption

Needed by both plans; build and test it first.

- `encryptCell(key, cellKey, hlc, value)` / `decryptCell(...)`: AES-GCM over
  `jsonStringWithUndefined(value)` (deletions encrypt the undefined marker),
  with additional authenticated data `kind|table|row|cell|hlc` so a value cannot
  be moved to another cell or timestamp.
- **Deterministic IV** (required for Plan A, harmless for Plan B): derive the
  12-byte IV from `HMAC-SHA-256(ivKey, kind|table|row|cell|hlc)`, with `ivKey`
  derived from the room key material separately from the AES key. Safe because a
  `(cell, hlc)` pair always identifies the same write and therefore the same
  plaintext. Needed so two devices that encrypt the same write (e.g. both
  converting an old snapshot) produce identical ciphertext and identical
  TinyBase hashes.
- `flattenChanges(changes | content) → Cell[]` and
  `buildChanges(cells) → MergeableChanges`. Container stamps
  (tables/table/row/values) need an HLC; use the maximum of their children.
- Decrypt in parallel chunks (`Promise.all`, e.g. 500 at a time).

## Phase 0: check TinyBase's sync stack

Timebox: about one day. Work in a throwaway branch; nothing ships.

What Plan A would use (all present in TinyBase 10.0.1):

- server: `WsServerDurableObject`
  (`tinybase/synchronizers/synchronizer-ws-server-durable-object`) with
  `createPersister()` returning `createDurableObjectSqlStoragePersister`
  (`tinybase/persisters/persister-durable-object-sql-storage`) in
  `mode: 'fragmented'`;
- client: `createWsSynchronizer`
  (`tinybase/synchronizers/synchronizer-ws-client`).

Checks (record results in this file):

1. **Hibernation.** `WsServerDurableObject` overrides `webSocketMessage` and
   `webSocketClose`, which suggests the WebSocket Hibernation API. Confirm in
   `wrangler dev` that an idle connected tab lets the object hibernate (no
   duration billed) and that sync still works after it wakes up (server store
   reloaded from the persister).
2. **Traffic per change and per reconnect.** Count WebSocket messages and bytes
   for: one new entry with two devices online; a device reconnecting after 50
   changes elsewhere; a fresh device joining a room with ~20,000 cells. Compare
   against Plan B's estimate (one POST per change, one paged GET per reconnect).
   Cloudflare bills incoming WebSocket messages at 20:1 against requests.
3. **Encrypted mirror round trip.** Prototype the bridge (see Plan A) with two
   browser contexts and the server: edits, deletions, concurrent edits of the
   same cell and of different cells converge, and `getMergeableContentHashes()`
   match across both mirrors and the server after sync.
4. **Old performance problem.** Find out why the earlier per-value encryption
   was slow (git history; the operator remembers "huge loading times").
   Benchmark decrypting a realistic room (export one locally; values never leave
   the machine) in Chromium with 4× CPU throttling. Target: under 2 s for a
   first join, under 100 ms for a typical reconnect.
5. **Reconnecting socket.** Check that `createWsSynchronizer` works with
   `PartySocket` (or another reconnecting WebSocket) and resyncs after a
   reconnect without recreating the synchronizer.
6. **Server-side limits.** Find out what TinyBase validates on received changes
   (malformed messages, timestamps far in the future; reportedly rejected beyond
   ~5 minutes, unverified) and how large a room the server can load into memory.

Decision: Plan A if checks 1, 3, 4 and 5 pass and check 2 is not more than a few
times Plan B's traffic. Otherwise Plan B. Check 6 adds tasks to Plan A but does
not block it.

### Phase 0 results (2026-11-05)

Prototype: `WsServerDurableObject` + SQL storage persister (fragmented) under
`wrangler dev`, Node clients with `createWsSynchronizer`, one table with 2,500
rows × 8 cells (20,000 cells, 40-byte random values).

1. **Hibernation: passes with a cost caveat.** The server uses
   `ctx.acceptWebSocket`, so idle connections can hibernate. Eviction can't be
   forced in `wrangler dev`, so this was read from the code: the constructor
   runs `persister.load()` inside `blockConcurrencyWhile` on every wake-up,
   which is a `SELECT *` over all cells (rows read = cells in the room, per
   wake-up), and then starts a server sync that sends `GetContentHashes` to
   every connected client.
2. **Traffic: passes.** Incoming WebSocket messages / bytes at the server: one
   new entry with two devices online: 1 / 770 B; reconnect after 50 changes
   elsewhere: 7 / 104 KB (the reconnecting client uploads the row hashes of
   every changed table, so this grows with the row count); fresh join: 5 / 164
   B, with 1.8 MB downloaded in one message. Messages are not fragmented by
   default.
3. **Encrypted mirror round trip: not prototyped**, since check 5 already
   decides.
4. **Old performance problem: passes.** The old per-value encryption
   (`983a0e3^`) awaited every cell one after another and re-encrypted whole
   contents on save. Decrypting 20,000 AES-GCM cells with AAD in Chromium with
   4× CPU throttling: 328 ms in chunks of 500 (388 ms sequential), 200 cells: 3
   ms. Same for both plans.
5. **Reconnecting socket: fails.** `createWsSynchronizer` removes its listeners
   on the first `close` event (`failTransport`), so a `PartySocket` that
   reconnects in place leaves a dead synchronizer; it has to be recreated per
   connection.
6. **Server-side limits.** Changes are validated as a whole
   (`validateMergeable`): one stamp with an HLC more than 5 minutes ahead of the
   receiver's clock drops the entire change set silently, on the server and on
   peers. Payloads above 16 MiB close the socket. The server keeps the whole
   room in memory.

Also observed: clients still diff with each other through the server (the
reconnect above included the other client's requests), which is the peer-to-peer
model the operator ruled out.

**Decision: Plan B** (check 5 fails; in addition: no peer-to-peer traffic, no
full room reload per wake-up, explicit handling of future HLCs).

## Plan A: TinyBase sync with an encrypted mirror store

### Overview

Each device has two `MergeableStore`s:

- the **app store** (plaintext, what the app reads and writes, persisted in
  IndexedDB as today);
- the **mirror store** (same cells and HLCs, values encrypted), persisted in its
  own IndexedDB database per room and synced with the server through
  `createWsSynchronizer`.

The server is a stock `WsServerDurableObject` holding the room's mirror store,
persisted in SQLite. It never sees plaintext.

### Bridge (the only custom sync code)

- App store → mirror: in a `DidFinishTransaction` listener, take
  `getTransactionMergeableChanges()`, encrypt each changed cell with its HLC and
  `applyMergeableChanges` to the mirror. Skip transactions that the bridge
  itself caused.
- Mirror → app store: same in the other direction for changes the synchronizer
  applied, decrypting.
- Startup: after both stores load, reconcile once: cells in the app store newer
  than (or missing from) the mirror are encrypted into the mirror, and vice
  versa. This covers a crash between the two persisters.
- Migrations run on the app store after the initial sync has completed
  (synchronizer reports the first full exchange), not on every incoming change.
  Their changes flow to the mirror like any local change.

### Server

- `party/main.ts`: route requests with the Worker's own `fetch` (instead of
  `routePartykitRequest`) to a class extending `WsServerDurableObject` with
  `createPersister()` → SQL storage persister, fragmented mode.
- Keep the Durable Object class name `Tinybase` so existing rooms keep their
  storage; override `fetch` to serve the legacy `GET /store` (read the existing
  snapshot keys) and, during the transition, `PUT /store`, then call
  `super.fetch` for WebSocket upgrades.
- Use a storage prefix for the persister so it cannot collide with the legacy
  snapshot keys.
- Old clients speak the old relay protocol on the same WebSocket path; use a
  different path (or TinyBase channel) for the new protocol so they don't
  receive each other's messages.

### Client

- Replace the custom synchronizer and snapshot code in `room-sync.ts` with:
  mirror store + persister, bridge, `createWsSynchronizer` on a reconnecting
  socket. Keep status reporting and the `online`/`offline` handling from PR
  #1526; map synchronizer activity to `syncing`/`synced`/`offline`.
- No sequence numbers, server stamps map or paging: the TinyBase protocol
  compares hashes and exchanges only differences.

### Plan A steps

1. Shared building block with unit tests (round trip, deletions, values,
   deterministic ciphertext, AAD rejects moved values).
2. Bridge with unit tests (both directions, no echo loops, startup reconcile,
   crash between persisters).
3. Server class, routing, legacy `/store`, wrangler config; tests with the
   Workers runtime (`wrangler dev` or vitest pool workers if available).
4. App: mirror persistence, synchronizer wiring, migrations timing, status.
5. Factory reset, `clear` join, room switching, cloning (shared section).
6. Remove the old synchronizer, snapshot save/load, CAS and chunking code.
7. E2E (shared section), then deploy (shared section).

## Plan B: hand-rolled per-cell server merge

Use when Phase 0 rules out Plan A.

### Server

SQLite (`this.ctx.storage.sql`):

```sql
CREATE TABLE IF NOT EXISTS cells (
  kind TEXT NOT NULL,        -- 't' for table cells, 'v' for values
  table_id TEXT NOT NULL,    -- '' for values
  row_id TEXT NOT NULL,      -- '' for values
  cell_id TEXT NOT NULL,     -- cell ID or value ID
  hlc TEXT NOT NULL,
  data TEXT NOT NULL,        -- per-cell ciphertext
  seq INTEGER NOT NULL,
  PRIMARY KEY (kind, table_id, row_id, cell_id)
);
CREATE INDEX IF NOT EXISTS cells_seq ON cells (seq);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- meta: head_seq
```

Endpoints (relative to the room URL; keep the CORS headers, add `POST`):

1. `POST /cells` with a JSON array of `{ kind, table, row, cell, hlc, data }`.
   - In one `transactionSync`: accept a cell only if there is no row yet or
     `hlc > stored hlc`; accepted cells get `seq = ++head_seq`. Equal or older
     HLCs are ignored without a write.
   - Reject HLCs more than e.g. 5 minutes ahead of the server clock with `422`
     and the offending keys.
   - Limits: `MAX_BATCH_CELLS` (e.g. 500), `MAX_BATCH_BYTES` (e.g. 512 KiB),
     `MAX_CELL_BYTES` (e.g. 64 KiB); `413` otherwise. Check the body size before
     parsing.
   - Response `{ head }`. Broadcast accepted cells to all connections, including
     the uploader: `{ type: 'cells', fromSeq, toSeq, cells }`.
2. `GET /cells?since=<seq>&limit=<n>` → cells with `seq > since` by `seq`, at
   most `limit` (cap e.g. 1000), plus `head`. A cell updated between pages moves
   to a higher `seq` and appears in a later page.
3. Legacy `/store` as described in the shared Migration section.

### Client: what to upload

The store has no stable unique ID, so an HLC does not reliably tell which device
wrote a cell. Keep a persisted **server stamps** map per room (cell key → HLC
the server is known to have) plus `lastSeq`, in their own IndexedDB database.

- Outbox: every local cell whose HLC is greater than its server stamp or has
  none. Unknown means upload, so the map can never cause a change to be skipped;
  a stale map only causes re-uploads the server ignores.
- Update the map on pull, broadcast and acknowledged upload.
- Full scan of `getMergeableContent()` at startup; afterwards an in-memory set
  of keys touched by local transactions as a hint.
- Persistence order: apply pulled cells, wait for the app store persister, then
  persist `lastSeq` and the map. A crash in between only re-pulls.

### Client: sync loop (`room-sync.ts`)

Keep the PR #1526 structure (single runner, backoff, status, triggers: local
change with 1 s debounce / max 5 s, reconnect, `online`).

1. **Pull**: page `GET /cells?since=lastSeq` to `head`, apply, update map and
   `lastSeq`; then run migrations and repairs.
2. **Push**: outbox in batches below the limits; update the map after each
   batch. `_migrations` cells go last, so a device pulling a partial upload runs
   the (deterministic, idempotent) migration itself rather than trusting a
   marker whose rows have not arrived. On `422` show a sync error and keep the
   data locally.
3. **Broadcast**: apply if `fromSeq == lastSeq + 1`, else pull. No migrations
   per broadcast.

Always pull before push. A single cell above `MAX_CELL_BYTES` is reported as a
sync error (location only, no values) and kept locally.

### Plan B steps

1. Shared building block with unit tests and the benchmark from Phase 0.
2. Server tables and endpoints with tests: newer wins, equal/older ignored
   without a seq bump, deletion beats an older value, paging during concurrent
   updates, limits, future-HLC rejection, broadcast content.
3. Client package: `pullCells`, `pushCells`, broadcast parsing, server stamps
   store; tests with mocked `fetch`/socket incl. interrupted batches and gaps.
4. App: `room-sync.ts`, persistence, legacy `/store` merge, migration timing.
5. Factory reset, `clear` join, room switching, cloning (shared section).
6. Remove the old synchronizer, snapshot save/load, CAS and chunking code.
7. E2E (shared section), then deploy (shared section).

## Shared: factory reset, joining with `clear`, switching rooms

Today both use deletions (`delTables().delValues()`, `setContent([{}, {}])`).
Deletions get new timestamps and would be synced, wiping the room's data on
every device if the device rejoins the same room.

- Stop room sync (dispose and wait for running work; ignore results that arrive
  after dispose) before clearing or switching.
- Start from fresh stores instead of deleting: delete the local IndexedDB
  databases (app store, plus mirror store or server stamps) and recreate the
  store, e.g. by reloading the app after the backup is written.

## Shared: cloning (`cloning.ts`)

Read the source room through the new protocol (Plan A: a temporary mirror store
synced once and decrypted; Plan B: all `GET /cells` pages); while the transition
lasts, also merge the source room's `GET /store`.

## Shared: migration of existing rooms and clients

- **Rooms**: during the transition, new clients read `GET /store` (with
  `If-None-Match`, so an unchanged snapshot costs a `304`) after each full sync,
  merge it into the app store, and let normal sync upload what the server is
  missing. Deterministic IVs make concurrent conversions by several devices
  produce identical cells. `GET /store` stays readable indefinitely so dormant
  rooms are never lost.
- **Devices updated from the old version** upload all their local data on first
  sync (Plan A: mirror is empty and gets filled from the app store; Plan B:
  server stamps map is empty).
- **Old clients** (until they reload; the service worker loads new builds
  network-first) keep using `/store` and the old WebSocket relay among
  themselves. New clients pick up their `/store` writes; old clients see new
  clients' changes after updating.
- **End of transition** (e.g. 4 weeks after the app deploy): `PUT /store`
  returns `410`; new clients read `/store` only for rooms with no new data yet;
  the old WebSocket relay is removed.
- **Deploy order**: server first (backward compatible), then the app.
- **Write volume**: the conversion writes about one SQLite row per cell of each
  room. Check the Durable Object plan's rows-written allowance (free plan
  reportedly 100,000 per day) before the app deploy.

## Shared: privacy

The server stores and sees: table, row, cell and value IDs (schema is public,
row IDs are random); the HLC of every cell, including the wall-clock time of
each edit; row counts per table, which cells are set, ciphertext sizes;
request/message timing and sizes. It cannot read any value. Do not log message
bodies or cell keys on the server.

## Shared: E2E tests

Extend `tests/helpers/relay.ts` to count requests/messages by type and to block
the new endpoints/socket path.

- two online devices: a new entry appears on the other device; record the number
  of requests/messages per change;
- offline device comes back and receives only what changed;
- concurrent edits of different cells of the same entry both survive; of the
  same cell, the later edit wins on both devices;
- deletion while the other device is offline is applied on both afterwards;
- a change made offline survives a reload and syncs once online;
- large backlog syncs completely and survives an interruption (Plan B: lower the
  batch limit via env);
- a room with only a legacy `/store` snapshot is converted, and its data appears
  on a second new device;
- factory reset and rejoin keep the room's data on all devices;
- existing specs (`relay-outage`, `offline-sync`, `offline-first-load`, idle tab
  without requests) still pass.

## Open questions

- Phase 0 results and the Plan A/B decision.
- Durable Object plan and rows-written allowance for the conversion.
- Limits (Plan B batch/cell limits, clock-skew window) after measuring real
  rooms.
- Transition length before `PUT /store` is turned off.
