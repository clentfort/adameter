# Adameter PartyServer

The encrypted TinyBase relay runs as a Cloudflare Worker backed by one
PartyServer Durable Object per hashed room ID. The Durable Object only relays
opaque ciphertext and stores encrypted snapshots; encryption keys remain in the
clients.

## Environments

| Environment       | Worker URL                                            |
| ----------------- | ----------------------------------------------------- |
| Production        | `https://adameter-party.adameter.workers.dev`         |
| Shared preview    | `https://adameter-party-preview.adameter.workers.dev` |
| Local development | `http://localhost:1999`                               |

Production builds use the production Worker, Vercel previews the shared preview.
Override with `NEXT_PUBLIC_PARTYKIT_HOST`.

## Migration from managed PartyKit

The managed PartyKit platform stops deploys on 2026-10-16 and deletes all room
data on 2026-10-23. Its room snapshots are opaque ciphertext, readable without
keys at
`https://adameter-party.clentfort.partykit.dev/parties/tinybase/<hashed room>/store`
(preview: `preview.adameter-party.clentfort.partykit.dev`). Data reaches the new
Worker in three ways:

1. **Local data.** Every client keeps its data in IndexedDB and pushes it to the
   (empty) new room on its first sync.
2. **Client-side migration.** On every start until the shutdown, clients also
   read the legacy room and CRDT-merge it
   (`src/lib/tinybase-sync/legacy-room-migration.ts`).
   `NEXT_PUBLIC_LEGACY_PARTYKIT_HOST` overrides the legacy host, e.g. for local
   testing.
3. **Offline copy.** For rooms whose IDs are known, copy the legacy snapshot
   into the room's `legacy-store` slot before 2026-10-23. Clients merge it on
   their next start, even after the shutdown:

   ```sh
   # once per environment; unset afterwards with `wrangler secret delete`
   pnpm exec wrangler secret put LEGACY_IMPORT_SECRET --env=""

   # rooms.txt: one room name or 64-character hashed room ID per line
   LEGACY_HOST=adameter-party.clentfort.partykit.dev \
   NEW_HOST=adameter-party.adameter.workers.dev \
   LEGACY_IMPORT_SECRET=... \
   pnpm exec tsx scripts/migrate-legacy-rooms.mts rooms.txt
   ```

   The script also writes each snapshot to `./export/` (git-ignored). The
   managed platform cannot list rooms, so the room IDs have to come from the
   PartyKit team or from the room names we know.

## Development

`pnpm dev` starts Next.js and Wrangler together. Wrangler listens on port 1999,
which matches the local host selected in `next.config.ts`.

Useful commands:

```sh
pnpm dev:partyserver
pnpm check:partyserver
pnpm deploy:partyserver:preview
pnpm deploy:partyserver
```

The Wrangler configuration declares the `Tinybase` Durable Object binding and
its initial SQLite-backed migration. Never rename or remove a Durable Object
class without adding a new migration entry.

## CI authentication

Main-branch deployments require a GitHub Actions repository secret named
`CLOUDFLARE_API_TOKEN`. Create a Cloudflare account API token with the **Edit
Cloudflare Workers** template, scoped to account
`296ad2d28c982363548f2493c36c1844`, then add it to the repository:

```sh
gh secret set CLOUDFLARE_API_TOKEN
```

Pull requests only type-check, test, and dry-run the Worker bundle. They do not
create stateful per-PR Workers; `main` maintains one shared preview namespace.
