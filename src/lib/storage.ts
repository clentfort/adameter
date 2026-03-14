export const STORAGE_KEYS = {
	PREFERRED_LANGUAGE: 'preferredLanguage',
	FEEDING_IN_PROGRESS_BACKUP: 'feedingInProgress-backup',
	DEVICE_ID: 'deviceId',
	ROOM: 'room',
	ROOM_JOIN_STRATEGY: 'room-join-strategy',
	SKIP_PROFILE_PROMPT: 'adameter-skip-profile',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function getItem(key: StorageKey): string | null {
	if (typeof window === 'undefined') {
		return null;
	}
	return window.localStorage.getItem(key);
}

export function setItem(key: StorageKey, value: string): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.setItem(key, value);
}

export function removeItem(key: StorageKey): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.removeItem(key);
}

export function clear(): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.clear();
}
