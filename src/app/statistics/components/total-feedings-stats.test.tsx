import type { FeedingSession } from '@/types/feeding';
import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectStatsCardPrimaryMetric } from '@/test-utils/assertions/stats-card';
import { createFeedingSessions } from '@/test-utils/factories/feeding-session';
import TotalFeedingsStats from './total-feedings-stats';

const mockSessions: FeedingSession[] = createFeedingSessions([
	{ breast: 'left', durationInSeconds: 600 },
	{ breast: 'right', durationInSeconds: 900 },
	{ breast: 'left', durationInSeconds: 300 },
	{
		breast: 'bottle' as unknown as FeedingSession['breast'],
		durationInSeconds: 300,
	},
]);

describe('TotalFeedingsStats', () => {
	it('renders null when no sessions are provided', () => {
		const { container } = render(<TotalFeedingsStats sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('displays total feedings and counts for left/right breast correctly', () => {
		const { container } = render(
			<TotalFeedingsStats sessions={mockSessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		expect(within(statsCard).getByText('Total Feedings')).toBeInTheDocument();
		expectStatsCardPrimaryMetric(statsCard, 4);

		const leftBreastLabelDiv = within(statsCard)
			.getByText(/Left Breast:/)
			.closest('div');
		expect(leftBreastLabelDiv).toBeInTheDocument();
		expect(within(leftBreastLabelDiv!).getByText('2')).toBeInTheDocument();

		const rightBreastLabelDiv = within(statsCard)
			.getByText(/Right Breast:/)
			.closest('div');
		expect(rightBreastLabelDiv).toBeInTheDocument();
		expect(within(rightBreastLabelDiv!).getByText('1')).toBeInTheDocument();
	});

	it('displays comparison values when comparisonSessions are provided', () => {
		const comparisonSessions: FeedingSession[] = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 600 },
			{ breast: 'right', durationInSeconds: 600 },
		]);
		const { container } = render(
			<TotalFeedingsStats
				comparisonSessions={comparisonSessions}
				sessions={mockSessions}
			/>,
		);
		const statsCard = container.firstChild as HTMLElement;

		// Total (4 vs 2) -> +100%
		const primaryMetricContainer =
			within(statsCard).getByText('4').parentElement!;
		expect(
			within(primaryMetricContainer).getByText(/100%/),
		).toBeInTheDocument();
		expect(within(primaryMetricContainer).getByText(/↑/)).toBeInTheDocument();

		// Left Breast (2 vs 1) -> +100%
		const leftBreastLabelDiv = within(statsCard)
			.getByText(/Left Breast:/)
			.closest('div')!;
		expect(within(leftBreastLabelDiv).getByText(/100%/)).toBeInTheDocument();
		expect(within(leftBreastLabelDiv).getByText(/↑/)).toBeInTheDocument();

		// Right Breast (1 vs 1) -> 0%
		// ComparisonValue returns null if change < 0.1%
		const rightBreastLabelDiv = within(statsCard)
			.getByText(/Right Breast:/)
			.closest('div');
		expect(within(rightBreastLabelDiv!).queryByText('%')).toBeNull();
	});

	it('handles sessions with only one breast type', () => {
		const leftOnlySessions: FeedingSession[] = [
			{ ...mockSessions[0], breast: 'left' },
			{ ...mockSessions[2], breast: 'left' },
		];
		const { container } = render(
			<TotalFeedingsStats sessions={leftOnlySessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		expectStatsCardPrimaryMetric(statsCard, 2);

		const leftBreastLabelDiv = within(statsCard)
			.getByText(/Left Breast:/)
			.closest('div');
		expect(within(leftBreastLabelDiv!).getByText('2')).toBeInTheDocument();

		const rightBreastLabelDiv = within(statsCard)
			.getByText(/Right Breast:/)
			.closest('div');
		expect(within(rightBreastLabelDiv!).getByText('0')).toBeInTheDocument();
	});

	it('handles sessions with no specific breast (e.g., bottle)', () => {
		const bottleOnlySessions: FeedingSession[] = [
			{
				...mockSessions[0],
				breast: 'bottle' as unknown as FeedingSession['breast'],
			},
			{
				...mockSessions[1],
				breast: 'bottle' as unknown as FeedingSession['breast'],
			},
		];
		const { container } = render(
			<TotalFeedingsStats sessions={bottleOnlySessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		expectStatsCardPrimaryMetric(statsCard, 2);

		const leftBreastLabelDiv = within(statsCard)
			.getByText(/Left Breast:/)
			.closest('div');
		expect(within(leftBreastLabelDiv!).getByText('0')).toBeInTheDocument();

		const rightBreastLabelDiv = within(statsCard)
			.getByText(/Right Breast:/)
			.closest('div');
		expect(within(rightBreastLabelDiv!).getByText('0')).toBeInTheDocument();
	});

	it('handles a single session', () => {
		const singleSession: FeedingSession[] = [
			{ ...mockSessions[0], breast: 'right' },
		];
		const { container } = render(
			<TotalFeedingsStats sessions={singleSession} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		expectStatsCardPrimaryMetric(statsCard, 1);

		const leftBreastLabelDiv = within(statsCard)
			.getByText(/Left Breast:/)
			.closest('div');
		expect(within(leftBreastLabelDiv!).getByText('0')).toBeInTheDocument();

		const rightBreastLabelDiv = within(statsCard)
			.getByText(/Right Breast:/)
			.closest('div');
		expect(within(rightBreastLabelDiv!).getByText('1')).toBeInTheDocument();
	});
});
