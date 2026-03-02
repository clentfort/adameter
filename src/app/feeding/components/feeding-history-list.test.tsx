import type { FeedingSession } from '@/types/feeding';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRowIds } from 'tinybase/ui-react';
import {
	useFeedingSessionRow,
	useFeedingSessions,
} from '@/hooks/use-feeding-sessions';
import HistoryList from './feeding-history-list';

vi.mock('@/hooks/use-feeding-sessions');
vi.mock('tinybase/ui-react', async () => {
	const actual = await vi.importActual('tinybase/ui-react');
	return {
		...actual,
		useRowIds: vi.fn(),
	};
});

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

		vi.mocked(useFeedingSessions).mockReturnValue({
			add: vi.fn(),
			historyRowIds: ['test-session-1'],
			remove: vi.fn(),
			rowIds: ['test-session-1'],
			update: vi.fn(),
		});
		vi.mocked(useRowIds).mockReturnValue(['test-session-1']);
		vi.mocked(useFeedingSessionRow).mockReturnValue(mockSession);

		render(<HistoryList />);

		// Assert duration is formatted correctly by formatDurationAbbreviated
		// formatDurationAbbreviated(1500) -> "25 min"
		expect(screen.getByText('25 min')).toBeInTheDocument();

		// Assert breast side is displayed correctly
		expect(screen.getByText('Left Breast')).toBeInTheDocument();
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

		vi.mocked(useFeedingSessions).mockReturnValue({
			add: vi.fn(),
			historyRowIds: ['test-session-2'],
			remove: vi.fn(),
			rowIds: ['test-session-2'],
			update: vi.fn(),
		});
		vi.mocked(useRowIds).mockReturnValue(['test-session-2']);
		vi.mocked(useFeedingSessionRow).mockReturnValue(mockSessionLong);

		render(<HistoryList />);

		// Assert duration is formatted correctly by formatDurationAbbreviated
		// formatDurationAbbreviated(4200) -> "1 h 10 min"
		expect(screen.getByText('1 h 10 min')).toBeInTheDocument();

		// Assert breast side is displayed correctly
		expect(screen.getByText('Right Breast')).toBeInTheDocument();
	});
});
