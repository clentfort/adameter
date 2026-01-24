import { TinyBasePartyKitServer } from 'tinybase/persisters/persister-partykit-server';

export default class PartyKitServer extends TinyBasePartyKitServer {
	async onMessage(
		...params: Parameters<TinyBasePartyKitServer['onMessage']>
	): Promise<void> {
		console.log('onMessage', params[0]);
		return super.onMessage(...params);
	}

	// async onRequest(
	// 	...params: Parameters<TinyBasePartyKitServer['onRequest']>
	// ): Promise<ReturnType<TinyBasePartyKitServer['onRequest']>> {
	// 	console.log('onRequest', params[0]);
	// 	return super.onRequest(...params);
	// }
}
