export function getDeviceId(): string {
	if (typeof window === 'undefined') {
		return 'server';
	}

	const existingId = localStorage.getItem('deviceId');
	if (existingId) {
		return existingId;
	}

	const newId =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

	localStorage.setItem('deviceId', newId);
	return newId;
}
