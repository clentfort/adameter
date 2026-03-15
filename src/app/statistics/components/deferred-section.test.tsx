import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DeferredSection from './deferred-section';

describe('DeferredSection', () => {
	beforeEach(() => {
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
	});

	it('renders fallback initially', () => {
		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		expect(screen.getByText('Fallback')).toBeInTheDocument();
		expect(screen.queryByText('Content')).not.toBeInTheDocument();
	});

	it('renders children after requestIdleCallback', async () => {
		render(
			<DeferredSection fallback={<div>Fallback</div>}>
				<div>Content</div>
			</DeferredSection>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(screen.getByText('Content')).toBeInTheDocument();
		expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
	});
});
