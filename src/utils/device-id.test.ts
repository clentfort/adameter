import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDeviceId } from './device-id';

describe('getDeviceId', () => {
	beforeEach(() => {
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(),
			setItem: vi.fn(),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns a new ID if none exists in localStorage', () => {
		vi.mocked(localStorage.getItem).mockReturnValue(null);

		const id = getDeviceId();

		expect(id).toBeDefined();
		expect(localStorage.setItem).toHaveBeenCalledWith('deviceId', id);
	});

	it('returns the existing ID from localStorage if it exists', () => {
		vi.mocked(localStorage.getItem).mockReturnValue('existing-id');

		const id = getDeviceId();

		expect(id).toBe('existing-id');
		expect(localStorage.setItem).not.toHaveBeenCalled();
	});

	it('returns "server" when window is undefined', () => {
		vi.stubGlobal('window', undefined);
		// Need to re-import or handle the fact that getDeviceId might have cached the window check
		// But in our implementation it checks every time
		const id = getDeviceId();
		expect(id).toBe('server');
	});
});
