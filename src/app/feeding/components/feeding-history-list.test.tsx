import type { FeedingSession } from '@/types/feeding';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import HistoryList from './feeding-history-list';

vi.mock('@/hooks/use-feeding-sessions', () => ({
	useFeedingSession: vi.fn(),
}));

const mockUseFeedingSession = vi.mocked(useFeedingSession);

describe('FeedingHistoryList', () => {
	it('should render a feeding session shorter than one hour correctly', () => {
		const durationInSeconds = 25 * 60; // 25 minutes
		const mockSession: FeedingSession = {
			breast: 'left',
			durationInSeconds,
			endTime: '2023-01-01T10:25:00Z',
			id: 'test-session-1',
			startTime: '2023-01-01T10:00:00Z',
		};

		mockUseFeedingSession.mockReturnValue(mockSession);

		render(
			<HistoryList
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
				sessionEntries={[
					{ id: mockSession.id, startTime: mockSession.startTime },
				]}
			/>,
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

		mockUseFeedingSession.mockReturnValue(mockSessionLong);

		render(
			<HistoryList
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
				sessionEntries={[
					{ id: mockSessionLong.id, startTime: mockSessionLong.startTime },
				]}
			/>,
		);

		// Assert duration is formatted correctly by formatDurationAbbreviated
		// formatDurationAbbreviated(4200) -> "1 h 10 min"
		expect(screen.getByText('1 h 10 min')).toBeInTheDocument();

		// Assert breast side is displayed correctly
		expect(screen.getAllByText('Right Breast').length).toBeGreaterThan(0);
	});
});
