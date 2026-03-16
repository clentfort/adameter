import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeferredSection from './deferred-section';

describe('DeferredSection', () => {
	let intersectionObserverCallback: (
		entries: IntersectionObserverEntry[],
	) => void;
	const observe = vi.fn();
	const disconnect = vi.fn();

	beforeEach(() => {
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

		vi.stubGlobal(
			'requestIdleCallback',
			vi.fn((cb) => {
				return setTimeout(cb, 0);
			}),
		);
		vi.stubGlobal(
			'cancelIdleCallback',
			vi.fn((id) => {
				clearTimeout(id);
			}),
		);
	});

	afterEach(() => {
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

		await act(async () => {
			intersectionObserverCallback([
				{ isIntersecting: true },
			] as IntersectionObserverEntry[]);
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(screen.getByText('Content')).toBeInTheDocument();
		expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
		expect(disconnect).toHaveBeenCalled();
	});
});
