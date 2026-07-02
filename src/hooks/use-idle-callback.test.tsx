import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cancelIdleCallback, requestIdleCallback } from '@/lib/idle-callback';
import { useIdleCallback } from './use-idle-callback';

vi.mock('@/lib/idle-callback', () => ({
	cancelIdleCallback: vi.fn(),
	requestIdleCallback: vi.fn(() => {
		// Simulate immediate execution for simple tests if needed,
		// or just return a handle.
		return 123;
	}),
}));

describe('useIdleCallback', () => {
	it('should schedule an idle callback on mount', () => {
		const callback = vi.fn();
		renderHook(() => useIdleCallback(callback));

		expect(requestIdleCallback).toHaveBeenCalled();
	});

	it('should execute the callback when idle', () => {
		let idleHandler: ((deadline: IdleDeadline) => void) | undefined;
		vi.mocked(requestIdleCallback).mockImplementationOnce((cb) => {
			idleHandler = cb;
			return 123;
		});

		const callback = vi.fn();
		renderHook(() => useIdleCallback(callback));

		expect(idleHandler).toBeDefined();
		idleHandler?.({
			didTimeout: false,
			timeRemaining: () => 50,
		} as IdleDeadline);
		expect(callback).toHaveBeenCalled();
	});

	it('should cancel the idle callback on unmount', () => {
		const handle = 123;
		vi.mocked(requestIdleCallback).mockReturnValue(handle);

		const { unmount } = renderHook(() => useIdleCallback(vi.fn()));

		unmount();

		expect(cancelIdleCallback).toHaveBeenCalledWith(handle);
	});

	it('should update the callback without rescheduling if dependencies do not change', () => {
		vi.mocked(requestIdleCallback).mockClear();
		const callback1 = vi.fn();
		const callback2 = vi.fn();

		let idleHandler: ((deadline: IdleDeadline) => void) | undefined;
		vi.mocked(requestIdleCallback).mockImplementation((cb) => {
			idleHandler = cb;
			return 123;
		});

		const { rerender } = renderHook(({ cb }) => useIdleCallback(cb, []), {
			initialProps: { cb: callback1 },
		});

		expect(requestIdleCallback).toHaveBeenCalledTimes(1);

		rerender({ cb: callback2 });

		expect(requestIdleCallback).toHaveBeenCalledTimes(1);

		idleHandler?.({
			didTimeout: false,
			timeRemaining: () => 50,
		} as IdleDeadline);
		expect(callback1).not.toHaveBeenCalled();
		expect(callback2).toHaveBeenCalled();
	});

	it('should reschedule when dependencies change', () => {
		vi.mocked(requestIdleCallback).mockClear();
		vi.mocked(cancelIdleCallback).mockClear();

		const callback = vi.fn();
		const { rerender } = renderHook(
			({ deps }) => useIdleCallback(callback, deps),
			{ initialProps: { deps: [1] } },
		);

		expect(requestIdleCallback).toHaveBeenCalledTimes(1);

		rerender({ deps: [2] });

		expect(cancelIdleCallback).toHaveBeenCalled();
		expect(requestIdleCallback).toHaveBeenCalledTimes(2);
	});
});
