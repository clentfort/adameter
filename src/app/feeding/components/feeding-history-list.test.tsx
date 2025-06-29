import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoryList from './feeding-history-list';
import type { FeedingSession } from '@/types/feeding';

// Use the shared mock. Path might need adjustment.
// Assuming vitest.fbtee-mock.ts is in src/
vi.mock('fbtee', async () => vi.importActual<typeof import('@/vitest.fbtee-mock')>('@/vitest.fbtee-mock'));

describe('FeedingHistoryList', () => {
	it('should render a feeding session shorter than one hour correctly', () => {
		const durationInSeconds = 25 * 60; // 25 minutes
		const mockSession: FeedingSession = {
			id: 'test-session-1',
			startTime: '2023-01-01T10:00:00Z',
			endTime: '2023-01-01T10:25:00Z',
			durationInSeconds,
			breast: 'left',
			notes: null,
		};

		render(
			<HistoryList
				sessions={[mockSession]}
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
			/>,
		);

		// Assert duration is formatted correctly by formatDurationAbbreviated
		// formatDurationAbbreviated(1500) -> "25 min"
		expect(screen.getByText('25 min')).toBeInTheDocument();

		// Assert breast side is displayed correctly
		expect(screen.getByText('Left Breast')).toBeInTheDocument();
	});

	it('should render a feeding session longer than one hour correctly', () => {
		const durationInSeconds = (1 * 60 + 10) * 60; // 1 hour and 10 minutes
		const mockSessionLong: FeedingSession = {
			id: 'test-session-2',
			startTime: '2023-01-01T12:00:00Z',
			endTime: '2023-01-01T13:10:00Z',
			durationInSeconds,
			breast: 'right',
			notes: 'A long session',
		};

		render(
			<HistoryList
				sessions={[mockSessionLong]}
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
			/>,
		);

		// Assert duration is formatted correctly by formatDurationAbbreviated
		// formatDurationAbbreviated(4200) -> "1 h 10 min"
		expect(screen.getByText('1 h 10 min')).toBeInTheDocument();

		// Assert breast side is displayed correctly
		expect(screen.getByText('Right Breast')).toBeInTheDocument();
	});
});
