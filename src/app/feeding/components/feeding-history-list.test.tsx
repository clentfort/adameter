import type { FeedingSession } from '@/types/feeding';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HistoryList from './feeding-history-list';

describe('FeedingHistoryList', () => {
	it('should render a left breast feeding session correctly', () => {
		const durationInSeconds = 25 * 60; // 25 minutes
		const mockSession: FeedingSession = {
			source: 'left',
			durationInSeconds,
			endTime: '2023-01-01T10:25:00Z',
			id: 'test-session-1',
			startTime: '2023-01-01T10:00:00Z',
		};

		render(
			<HistoryList
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
				sessions={[mockSession]}
			/>,
		);

		expect(screen.getByText('25 min')).toBeInTheDocument();
		expect(screen.getByText('Left Breast')).toBeInTheDocument();
	});

	it('should render a right breast feeding session correctly', () => {
		const durationInSeconds = (1 * 60 + 10) * 60; // 1 hour and 10 minutes
		const mockSessionLong: FeedingSession = {
			source: 'right',
			durationInSeconds,
			endTime: '2023-01-01T13:10:00Z',
			id: 'test-session-2',
			startTime: '2023-01-01T12:00:00Z',
		};

		render(
			<HistoryList
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
				sessions={[mockSessionLong]}
			/>,
		);

		expect(screen.getByText('1 h 10 min')).toBeInTheDocument();
		expect(screen.getByText('Right Breast')).toBeInTheDocument();
	});

	it('should render a bottle feeding session correctly', () => {
		const mockSession: FeedingSession = {
			source: 'bottle',
			amountInMl: 120,
			endTime: '2023-01-01T10:25:00Z',
			id: 'test-session-3',
			startTime: '2023-01-01T10:00:00Z',
		};

		render(
			<HistoryList
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
				sessions={[mockSession]}
			/>,
		);

		expect(screen.getByText('120 ml')).toBeInTheDocument();
		expect(screen.getByText('Bottle')).toBeInTheDocument();
	});

	it('should render a pump session correctly', () => {
		const mockSession: FeedingSession = {
			source: 'pump',
			amountInMl: 80,
			endTime: '2023-01-01T10:25:00Z',
			id: 'test-session-4',
			startTime: '2023-01-01T10:00:00Z',
		};

		render(
			<HistoryList
				onSessionDelete={() => {}}
				onSessionUpdate={() => {}}
				sessions={[mockSession]}
			/>,
		);

		expect(screen.getByText('80 ml')).toBeInTheDocument();
		expect(screen.getByText('Pump')).toBeInTheDocument();
	});
});
