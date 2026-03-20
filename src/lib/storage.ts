export const STORAGE_KEYS = {
	DEVICE_ID: 'deviceId',
	PREFERRED_LANGUAGE: 'preferredLanguage',
	ROOM: 'room',
	ROOM_JOIN_STRATEGY: 'room-join-strategy',
	SHOW_COMPARISON_CHARTS: 'adameter-show-comparison',
	SKIP_PROFILE_PROMPT: 'adameter-skip-profile',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function getItem(key: string): string | null {
	if (typeof window === 'undefined') {
		return null;
	}
	return window.localStorage.getItem(key);
}

export function setItem(key: string, value: string): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.setItem(key, value);
}

export function removeItem(key: string): void {
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
