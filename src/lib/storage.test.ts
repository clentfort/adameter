import { describe, expect, it, vi } from 'vitest';
import { clear, getItem, removeItem, setItem, STORAGE_KEYS } from './storage';

describe('storage', () => {
	it('should handle all operations in both browser and SSR environments', () => {
		// Scenario 1: Browser environment
		setItem(STORAGE_KEYS.DEVICE_ID, 'test-val');
		expect(getItem(STORAGE_KEYS.DEVICE_ID)).toBe('test-val');
		removeItem(STORAGE_KEYS.DEVICE_ID);
		expect(getItem(STORAGE_KEYS.DEVICE_ID)).toBeNull();

		setItem(STORAGE_KEYS.ROOM, 'room1');
		clear();
		expect(getItem(STORAGE_KEYS.ROOM)).toBeNull();

		// Scenario 2: SSR environment (mocking window as undefined)
		vi.stubGlobal('window', undefined);
		try {
			expect(getItem(STORAGE_KEYS.DEVICE_ID)).toBeNull();
			expect(() => setItem(STORAGE_KEYS.DEVICE_ID, 'val')).not.toThrow();
			expect(() => removeItem(STORAGE_KEYS.DEVICE_ID)).not.toThrow();
			expect(() => clear()).not.toThrow();
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
