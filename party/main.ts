import { routePartykitRequest } from 'partyserver';
import { EncryptedSyncRelayServer } from 'tinybase-synchronizer-partykit-server-encrypted';

interface Env extends Cloudflare.Env {
	// Set with `wrangler secret put LEGACY_IMPORT_SECRET` while rooms are copied
	// from the retired managed PartyKit deployment. Unset disables imports.
	LEGACY_IMPORT_SECRET?: string;
	Tinybase: DurableObjectNamespace<Tinybase>;
}

export class Tinybase extends EncryptedSyncRelayServer<Env> {
	protected override getLegacyImportSecret() {
		return this.env.LEGACY_IMPORT_SECRET || undefined;
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return (
			(await routePartykitRequest(request, env)) ??
			new Response('Not found', { status: 404 })
		);
	},
} satisfies ExportedHandler<Env>;
