/**
 * A polyfill for requestIdleCallback.
 */
export const requestIdleCallback =
	typeof window !== 'undefined'
		? (window as Window).requestIdleCallback ||
			((cb: IdleRequestCallback) =>
				window.setTimeout(() => {
					cb({
						didTimeout: false,
						timeRemaining: () => 50,
					});
				}, 1) as unknown as number)
		: ((() => 0) as unknown as (typeof window)['requestIdleCallback']);

/**
 * A polyfill for cancelIdleCallback.
 */
export const cancelIdleCallback =
	typeof window !== 'undefined'
		? (window as Window).cancelIdleCallback ||
			((id: number) => window.clearTimeout(id))
		: ((() => {}) as unknown as (typeof window)['cancelIdleCallback']);
