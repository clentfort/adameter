import type { Locale } from '@/i18n';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nContext } from '@/contexts/i18n-context';
import { DEFAULT_LOCALE } from '@/i18n';
import TimeSince from './time-since';

// Mock HeaderIndicator to simplify testing
vi.mock('./header-indicator', () => ({
	default: ({
		children,
		icon,
		label,
	}: {
		children: React.ReactNode;
		icon: React.ReactNode;
		label: React.ReactNode;
	}) => (
		<div data-testid="header-indicator">
			<div data-testid="icon">{icon}</div>
			<div data-testid="label">{label}</div>
			<div data-testid="content">{children}</div>
		</div>
	),
}));

describe('TimeSince', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const mockContextValue = {
		locale: DEFAULT_LOCALE as Locale,
		setLocale: async () => {},
	};

	it('renders "No data yet ago" when lastChange is null', () => {
		render(
			<I18nContext.Provider value={mockContextValue}>
				<TimeSince icon={<span>📅</span>} lastChange={null}>
					Last Diaper
				</TimeSince>
			</I18nContext.Provider>,
		);

		expect(screen.getByTestId('label')).toHaveTextContent('Last Diaper');
		expect(screen.getByTestId('icon')).toHaveTextContent('📅');
		expect(screen.getByTestId('content')).toHaveTextContent('No data yet ago');
	});

	it('renders relative time when lastChange is provided', () => {
		const now = new Date();
		const tenMinutesAgo = new Date(
			now.getTime() - 10 * 60 * 1000,
		).toISOString();

		render(
			<I18nContext.Provider value={mockContextValue}>
				<TimeSince icon={<span>📅</span>} lastChange={tenMinutesAgo}>
					Last Diaper
				</TimeSince>
			</I18nContext.Provider>,
		);

		expect(screen.getByTestId('content')).toHaveTextContent('10 minutes ago');
	});

	it('updates the time every minute', () => {
		const now = new Date();
		const justNow = now.toISOString();

		render(
			<I18nContext.Provider value={mockContextValue}>
				<TimeSince icon={<span>📅</span>} lastChange={justNow}>
					Last Diaper
				</TimeSince>
			</I18nContext.Provider>,
		);

		expect(screen.getByTestId('content')).toHaveTextContent(
			'less than a minute ago',
		);

		// Advance time by 2 minutes
		act(() => {
			vi.advanceTimersByTime(2 * 60 * 1000);
		});

		expect(screen.getByTestId('content')).toHaveTextContent('2 minutes ago');
	});
});
