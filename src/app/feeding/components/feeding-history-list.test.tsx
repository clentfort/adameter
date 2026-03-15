import type { FeedingSession } from '@/types/feeding';
import { render, screen } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it, vi } from 'vitest';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import HistoryList from './feeding-history-list';

vi.mock('@/hooks/use-feeding-sessions', () => ({
	useFeedingSession: vi.fn(),
}));

const mockUseFeedingSession = vi.mocked(useFeedingSession);

vi.mock('@/hooks/use-formula-products', () => ({
	useFormulaProductsSnapshot: () => [],
}));

vi.mock('@/hooks/use-feeding-products', () => ({
	useFeedingProductsSnapshot: () => [],
}));

vi.mock('@/hooks/use-profile', () => ({
	useProfile: () => [{}, vi.fn()],
}));

function createStoreWithSessions(sessions: FeedingSession[]) {
	const store = createStore();
	for (const session of sessions) {
		store.setRow(TABLE_IDS.FEEDING_SESSIONS, session.id, {
			breast: session.breast as string,
			durationInSeconds: session.durationInSeconds,
			endTime: session.endTime,
			startTime: session.startTime,
			type: session.type,
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
	it('should render a feeding session shorter than one hour correctly', () => {
		const durationInSeconds = 25 * 60; // 25 minutes
		const mockSession: FeedingSession = {
			breast: 'left',
			durationInSeconds,
			endTime: '2023-01-01T10:25:00Z',
			id: 'test-session-1',
			startTime: '2023-01-01T10:00:00Z',
			type: 'breast',
		};

		mockUseFeedingSession.mockReturnValue(mockSession);

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
			type: 'breast',
		};

		mockUseFeedingSession.mockReturnValue(mockSessionLong);

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
});
