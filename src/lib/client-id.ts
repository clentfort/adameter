export function getOrCreateClientId(): string {
	if (typeof window === 'undefined') {
		return 'server';
	}
	const key = 'adameter-client-id';
	let clientId = localStorage.getItem(key);
	if (!clientId) {
		clientId = crypto.randomUUID();
		localStorage.setItem(key, clientId);
	}
	return clientId;
}
