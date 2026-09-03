import type { Event } from '@/types/event';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/contexts/i18n-context';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import EventsList from './events-list';

vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
}));

const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

function createStoreWithEvents(events: Event[]) {
	const store = createStore();
	for (const event of events) {
		store.setRow(TABLE_IDS.EVENTS, event.id, {
			color: event.color ?? '#6366f1',
			endDate: event.endDate ?? '',
			notes: event.notes ?? '',
			startDate: event.startDate,
			title: event.title,
			type: event.type,
		});
	}
	return store;
}

function TestWrapper({
	children,
	events,
}: {
	children: React.ReactNode;
	events: Event[];
}) {
	const store = createStoreWithEvents(events);
	return (
		<I18nProvider>
			<Provider store={store}>
				<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
			</Provider>
		</I18nProvider>
	);
}

describe('EventsList', () => {
	const mockPush = vi.fn();

	beforeEach(() => {
		mockPush.mockClear();
		mockUseRouter.mockReturnValue({
			push: mockPush,
		} as unknown as ReturnType<typeof useRouter>);

		mockUseSearchParams.mockReturnValue(
			new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>,
		);

		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should render empty state when no events are recorded', () => {
		render(
			<TestWrapper events={[]}>
				<EventsList />
			</TestWrapper>,
		);

		expect(screen.getByText('No data recorded yet.')).toBeInTheDocument();
	});

	it('should render point in time event and period event correctly', () => {
		const events: Event[] = [
			{
				color: '#ec4899',
				id: 'event-1',
				notes: 'Vaccination details notes',
				startDate: '2024-01-15T10:00:00Z',
				title: 'Vaccination',
				type: 'point',
			},
			{
				color: '#10b981',
				endDate: '2024-01-18T10:00:00Z',
				id: 'event-2',
				startDate: '2024-01-15T09:00:00Z',
				title: 'Flu Illness',
				type: 'period',
			},
			{
				id: 'event-3',
				startDate: '2024-01-15T08:00:00Z',
				title: 'Ongoing Teething',
				type: 'period',
			},
		];

		render(
			<TestWrapper events={events}>
				<EventsList />
			</TestWrapper>,
		);

		expect(screen.getByText('Vaccination')).toBeInTheDocument();
		expect(screen.getByText('Vaccination details notes')).toBeInTheDocument();

		expect(screen.getByText('Flu Illness')).toBeInTheDocument();
		expect(screen.getAllByText(/15\.01\.2024/)).toHaveLength(2);
		expect(screen.getByText(/18\.01\.2024/)).toBeInTheDocument();

		expect(screen.getByText('Ongoing Teething')).toBeInTheDocument();
		expect(screen.getByText('ongoing')).toBeInTheDocument();
	});

	it('should navigate to feeding sessions and diaper changes from extra menu actions', () => {
		const event: Event = {
			color: '#ec4899',
			endDate: '2024-01-18T10:00:00Z',
			id: 'event-1',
			startDate: '2024-01-14T10:00:00Z',
			title: 'Flu Event',
			type: 'period',
		};

		render(
			<TestWrapper events={[event]}>
				<EventsList />
			</TestWrapper>,
		);

		const actionButtons = screen.getAllByTestId('history-entry-actions');
		fireEvent.click(actionButtons[0]);

		// Click Show Feeding Sessions
		const feedingOption = screen.getByText('Show Feeding Sessions');
		fireEvent.click(feedingOption);

		expect(mockPush).toHaveBeenLastCalledWith(
			'/feeding?from=2024-01-14T10:00:00Z&to=2024-01-18T10:00:00Z&event=Flu%20Event&color=%23ec4899',
		);

		// Open menu again and click Show Diaper Changes
		fireEvent.click(actionButtons[0]);
		const diaperOption = screen.getByText('Show Diaper Changes');
		fireEvent.click(diaperOption);

		expect(mockPush).toHaveBeenLastCalledWith(
			'/diaper?from=2024-01-14T10:00:00Z&to=2024-01-18T10:00:00Z&event=Flu%20Event&color=%23ec4899',
		);
	});

	it('should handle edit and delete dialog workflows', () => {
		const event: Event = {
			id: 'event-1',
			startDate: '2024-01-15T10:00:00Z',
			title: 'Checkup',
			type: 'point',
		};

		render(
			<TestWrapper events={[event]}>
				<EventsList />
			</TestWrapper>,
		);

		const actionButton = screen.getByTestId('history-entry-actions');

		// Open Edit Dialog
		fireEvent.click(actionButton);
		fireEvent.click(screen.getByText('Edit'));
		expect(screen.getByText('Edit Event Entry')).toBeInTheDocument();

		// Close Edit Dialog via Cancel
		fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
		expect(screen.queryByText('Edit Event Entry')).not.toBeInTheDocument();

		// Open Delete Dialog
		fireEvent.click(actionButton);
		fireEvent.click(screen.getByText('Delete'));
		expect(
			screen.getByText(/do you really want to delete this entry\?/i),
		).toBeInTheDocument();

		// Confirm deletion
		fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
		expect(screen.getByText('No data recorded yet.')).toBeInTheDocument();
	});

	it('should respect searchParams from/to to set initialVisibleCount', () => {
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams(
				'from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z',
			) as unknown as ReturnType<typeof useSearchParams>,
		);

		const event: Event = {
			id: 'event-1',
			startDate: '2024-01-15T10:00:00Z',
			title: 'Checkup',
			type: 'point',
		};

		render(
			<TestWrapper events={[event]}>
				<EventsList />
			</TestWrapper>,
		);

		expect(screen.getByText('Checkup')).toBeInTheDocument();
	});

	it('should render null for non-existent event in list item', () => {
		const store = createStore();
		// Manually index a non-existent event ID under a date index key
		store.setRow(TABLE_IDS.EVENTS, 'invalid-id', {
			startDate: '2024-01-15T10:00:00Z',
		});

		render(
			<Provider store={store}>
				<I18nProvider>
					<TinybaseIndexesProvider>
						<EventsList />
					</TinybaseIndexesProvider>
				</I18nProvider>
			</Provider>,
		);

		expect(screen.queryByTestId('event-entry')).not.toBeInTheDocument();
	});
});
