import * as storage from '@/lib/storage';

export function getDeviceId(): string {
	if (typeof window === 'undefined') {
		return 'server';
	}

	const existingId = storage.getItem(storage.STORAGE_KEYS.DEVICE_ID);
	if (existingId) {
		return existingId;
	}

	const newId =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

	storage.setItem(storage.STORAGE_KEYS.DEVICE_ID, newId);
	return newId;
}
