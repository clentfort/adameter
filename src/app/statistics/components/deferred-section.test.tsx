import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeferredSection from './deferred-section';

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

	it('handles case when containerRef.current is null', () => {
		const useRefSpy = vi
			.spyOn(React, 'useRef')
			.mockReturnValue({ current: null });

		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		expect(screen.getByText('Fallback')).toBeInTheDocument();
		useRefSpy.mockRestore();
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
