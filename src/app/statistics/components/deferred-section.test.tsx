import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeferredSection from './deferred-section';

let mockCustomRef: React.RefObject<HTMLDivElement> | null = null;
let mockEffectInterceptor: ((cb: React.EffectCallback) => void) | null = null;

vi.mock('react', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react')>();
	return {
		...actual,
		useEffect: (cb: React.EffectCallback, deps?: React.DependencyList) => {
			if (mockEffectInterceptor) {
				mockEffectInterceptor(cb);
			}
			return actual.useEffect(cb, deps);
		},
		useRef: <T,>(initialValue: T) => {
			if (mockCustomRef) {
				return mockCustomRef;
			}
			return actual.useRef(initialValue);
		},
	};
});

describe('DeferredSection', () => {
	let intersectionObserverCallback: (
		entries: IntersectionObserverEntry[],
	) => void;
	const observe = vi.fn();
	const disconnect = vi.fn();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
					intersectionObserverCallback = cb;
				}
				observe = observe;
				disconnect = disconnect;
			},
		);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it('renders fallback initially', () => {
		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		expect(screen.getByText('Fallback')).toBeInTheDocument();
		expect(screen.queryByText('Content')).not.toBeInTheDocument();
		expect(observe).toHaveBeenCalled();
	});

	it('renders children after intersection and requestIdleCallback', async () => {
		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		expect(screen.getByText('Fallback')).toBeInTheDocument();

		act(() => {
			intersectionObserverCallback([
				{ isIntersecting: true },
			] as IntersectionObserverEntry[]);
		});

		await act(async () => {
			vi.runAllTimers();
		});

		expect(screen.getByText('Content')).toBeInTheDocument();
		expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
		expect(disconnect).toHaveBeenCalled();
	});

	it('returns early when container element ref is null in useEffect', () => {
		mockCustomRef = Object.defineProperty({}, 'current', {
			get() {
				return null;
			},
			set(_v) {},
		}) as unknown as React.RefObject<HTMLDivElement>;

		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		expect(screen.getByText('Fallback')).toBeInTheDocument();
		mockCustomRef = null;
	});

	it('returns early in useEffect when window is undefined', () => {
		let effectCb: React.EffectCallback | undefined;
		mockEffectInterceptor = (cb) => {
			if (!effectCb) {
				effectCb = cb;
			}
		};

		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		mockEffectInterceptor = null;

		expect(effectCb).toBeDefined();

		vi.stubGlobal('window', undefined);
		try {
			const cleanup = effectCb!();
			expect(cleanup).toBeUndefined();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('handles disconnect and cleanup on unmount', () => {
		const { unmount } = render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		unmount();
		expect(disconnect).toHaveBeenCalled();
	});

	it('does not trigger intersect state if entries is empty or first entry is not intersecting', () => {
		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		act(() => {
			// Empty entries
			intersectionObserverCallback([]);
		});
		expect(screen.getByText('Fallback')).toBeInTheDocument();

		act(() => {
			// Entry is not intersecting
			intersectionObserverCallback([
				{ isIntersecting: false },
			] as IntersectionObserverEntry[]);
		});
		expect(screen.getByText('Fallback')).toBeInTheDocument();
	});

	it('does not set shouldRender if isIntersecting is false during useIdleCallback', () => {
		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		// Trigger requestIdleCallback via fake timers, but isIntersecting remains false
		act(() => {
			vi.runAllTimers();
		});

		expect(screen.getByText('Fallback')).toBeInTheDocument();
		expect(screen.queryByText('Content')).not.toBeInTheDocument();
	});

	it('renders children when intersection occurs before idle callback execution', async () => {
		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		act(() => {
			intersectionObserverCallback([
				{ isIntersecting: true },
			] as IntersectionObserverEntry[]);
		});

		act(() => {
			vi.runAllTimers();
		});

		expect(screen.getByText('Content')).toBeInTheDocument();
		expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
	});

	it('renders fallback in SSR via renderToString', () => {
		const html = renderToString(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		expect(html).toContain('Fallback');
	});
});
