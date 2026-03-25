import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('idle-callback polyfill', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it('uses native requestIdleCallback if available', async () => {
		const mockRequestIdleCallback = vi.fn().mockReturnValue(123);
		const mockCancelIdleCallback = vi.fn();

		vi.stubGlobal('window', {
			cancelIdleCallback: mockCancelIdleCallback,
			requestIdleCallback: mockRequestIdleCallback,
		});

		const { cancelIdleCallback, requestIdleCallback } =
			await import('./idle-callback');

		expect(requestIdleCallback).toBe(mockRequestIdleCallback);
		expect(cancelIdleCallback).toBe(mockCancelIdleCallback);
	});

	it('provides a polyfill if requestIdleCallback is not available in window', async () => {
		vi.stubGlobal('window', {
			clearTimeout: window.clearTimeout,
			setTimeout: window.setTimeout,
		});

		const { cancelIdleCallback, requestIdleCallback } =
			await import('./idle-callback');

		const cb = vi.fn();
		const id = requestIdleCallback(cb);

		expect(id).toBeDefined();
		expect(cb).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(cb).toHaveBeenCalledWith(
			expect.objectContaining({
				didTimeout: false,
				timeRemaining: expect.any(Function),
			}),
		);

		const deadline = cb.mock.calls[0][0];
		expect(deadline.timeRemaining()).toBe(50);

		const spy = vi.spyOn(window, 'clearTimeout');
		cancelIdleCallback(id);
		expect(spy).toHaveBeenCalledWith(id);
	});

	it('provides dummy functions if window is undefined', async () => {
		vi.stubGlobal('window', undefined);

		const { cancelIdleCallback, requestIdleCallback } =
			await import('./idle-callback');

		expect(requestIdleCallback(() => {})).toBe(0);
		expect(cancelIdleCallback(123)).toBeUndefined();
	});
});
