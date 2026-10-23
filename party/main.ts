import { routePartykitRequest } from 'partyserver';
import { EncryptedSyncRelayServer } from 'tinybase-synchronizer-partykit-server-encrypted';

interface Env extends Cloudflare.Env {
	Tinybase: DurableObjectNamespace<Tinybase>;
}

export class Tinybase extends EncryptedSyncRelayServer<Env> {}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return (
			(await routePartykitRequest(request, env)) ??
			new Response('Not found', { status: 404 })
		);
	},
} satisfies ExportedHandler<Env>;
