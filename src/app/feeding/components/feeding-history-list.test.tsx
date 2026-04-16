import type { FeedingSession } from '@/types/feeding';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import HistoryList from './feeding-history-list';

vi.mock('@/hooks/use-feeding-sessions', () => ({
	useFeedingSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
}));

const mockUseFeedingSession = vi.mocked(useFeedingSession);
const mockUseRouter = vi.mocked(useRouter);
const mockUseSearchParams = vi.mocked(useSearchParams);

function createStoreWithSessions(sessions: FeedingSession[]) {
	const store = createStore();
	for (const session of sessions) {
		store.setRow(TABLE_IDS.FEEDING_SESSIONS, session.id, {
			breast: session.breast,
			durationInSeconds: session.durationInSeconds,
			endTime: session.endTime,
			startTime: session.startTime,
		});
	}
	return store;
}

function TestWrapper({
	children,
	sessions,
}: {
	children: React.ReactNode;
	sessions: FeedingSession[];
}) {
	const store = createStoreWithSessions(sessions);
	return (
		<Provider store={store}>
			<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
		</Provider>
	);
}

describe('FeedingHistoryList', () => {
	beforeEach(() => {
		mockUseRouter.mockReturnValue({
			push: vi.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		mockUseSearchParams.mockReturnValue(
			new URLSearchParams(
				'from=2023-01-01T00:00:00Z&to=2023-01-01T23:59:59Z',
			) as unknown as ReturnType<typeof useSearchParams>,
		);
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should render a feeding session shorter than one hour correctly', () => {
		const durationInSeconds = 25 * 60; // 25 minutes
		const mockSession: FeedingSession = {
			breast: 'left',
			durationInSeconds,
			endTime: '2023-01-01T10:25:00Z',
			id: 'test-session-1',
			startTime: '2023-01-01T10:00:00Z',
		};

		mockUseFeedingSession.mockImplementation((id) =>
			id === mockSession.id ? mockSession : undefined,
		);

		render(
			<TestWrapper sessions={[mockSession]}>
				<HistoryList onSessionDelete={() => {}} onSessionUpdate={() => {}} />
			</TestWrapper>,
		);

		// Assert duration is formatted correctly by formatDurationAbbreviated
		// formatDurationAbbreviated(1500) -> "25 min"
		expect(screen.getByText('25 min')).toBeInTheDocument();

		// Assert breast side is displayed correctly
		expect(screen.getAllByText('Left Breast').length).toBeGreaterThan(0);
	});

	it('should render a feeding session longer than one hour correctly', () => {
		const durationInSeconds = (1 * 60 + 10) * 60; // 1 hour and 10 minutes
		const mockSessionLong: FeedingSession = {
			breast: 'right',
			durationInSeconds,
			endTime: '2023-01-01T13:10:00Z',
			id: 'test-session-2',
			startTime: '2023-01-01T12:00:00Z',
		};

		mockUseFeedingSession.mockImplementation((id) =>
			id === mockSessionLong.id ? mockSessionLong : undefined,
		);

		render(
			<TestWrapper sessions={[mockSessionLong]}>
				<HistoryList onSessionDelete={() => {}} onSessionUpdate={() => {}} />
			</TestWrapper>,
		);

		// Assert duration is formatted correctly by formatDurationAbbreviated
		// formatDurationAbbreviated(4200) -> "1 h 10 min"
		expect(screen.getByText('1 h 10 min')).toBeInTheDocument();

		// Assert breast side is displayed correctly
		expect(screen.getAllByText('Right Breast').length).toBeGreaterThan(0);
	});

	it('should handle edit and delete interactions', () => {
		const mockSession: FeedingSession = {
			breast: 'left',
			durationInSeconds: 600,
			endTime: '2023-01-01T10:10:00Z',
			id: 'test-session-edit',
			startTime: '2023-01-01T10:00:00Z',
		};

		mockUseFeedingSession.mockImplementation((id) =>
			id === mockSession.id ? mockSession : undefined,
		);

		render(
			<TestWrapper sessions={[mockSession]}>
				<HistoryList onSessionDelete={() => {}} onSessionUpdate={() => {}} />
			</TestWrapper>,
		);

		// Open actions menu
		const actionsButton = screen.getByTestId('history-entry-actions');
		fireEvent.click(actionsButton);

		// Click Edit
		const editButton = screen.getByText('Edit');
		fireEvent.click(editButton);

		// Check if Edit form is shown
		expect(screen.getByText('Edit Feeding Session')).toBeInTheDocument();

		// Close Edit form (using Cancel button)
		const cancelEditButton = screen.getByRole('button', { name: /cancel/i });
		fireEvent.click(cancelEditButton);
		expect(screen.queryByText('Edit Feeding Session')).not.toBeInTheDocument();

		// Open actions menu again for delete
		fireEvent.click(actionsButton);

		// Click Delete
		const deleteButton = screen.getByText('Delete');
		fireEvent.click(deleteButton);

		// Check if Delete dialog is shown
		expect(
			screen.getByText(/do you really want to delete this entry\?/i),
		).toBeInTheDocument();

		// Close Delete dialog
		const cancelDeleteButton = screen.getByRole('button', { name: /cancel/i });
		fireEvent.click(cancelDeleteButton);
		expect(
			screen.queryByText(/do you really want to delete this entry\?/i),
		).not.toBeInTheDocument();
	});
});
