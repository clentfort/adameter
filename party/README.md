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
