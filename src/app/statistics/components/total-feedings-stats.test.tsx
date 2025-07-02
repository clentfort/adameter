import type { FeedingSession } from '@/types/feeding';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TotalFeedingsStats from './total-feedings-stats';

const mockSessions: FeedingSession[] = [
	{
		breast: 'left',
		durationInSeconds: 600,
		endTime: new Date().toISOString(),
		id: '1',
		// @ts-expect-error
		notes: '',
		startTime: new Date().toISOString(),
	},
	{
		breast: 'right',
		durationInSeconds: 900,
		endTime: new Date().toISOString(),
		id: '2',
		// @ts-expect-error
		notes: '',
		startTime: new Date().toISOString(),
	},
	{
		breast: 'left',
		durationInSeconds: 300,
		endTime: new Date().toISOString(),
		id: '3',
		// @ts-expect-error
		notes: '',
		startTime: new Date().toISOString(),
	},
	{
		breast: 'bottle' as FeedingSession['breast'], // Should be ignored by left/right counts but included in total
		durationInSeconds: 300,
		endTime: new Date().toISOString(),
		id: '4',
		// @ts-expect-error
		notes: '',
		startTime: new Date().toISOString(),
	},
];
// Total sessions: 4
// Left: 2
// Right: 1

describe('TotalFeedingsStats', () => {
	it('renders null when no sessions are provided', () => {
		const { container } = render(<TotalFeedingsStats sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('displays total feedings and counts for left/right breast correctly', () => {
		render(<TotalFeedingsStats sessions={mockSessions} />);

		const { container } = render(
			<TotalFeedingsStats sessions={mockSessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		expect(within(statsCard).getByText('Total Feedings')).toBeInTheDocument();
		const totalFeedingsValue = within(statsCard).getByText(
			(content, element) => {
				return (
					element?.tagName.toLowerCase() === 'div' &&
					element.classList.contains('text-2xl') &&
					content === '4'
				);
			},
		);
		expect(totalFeedingsValue).toBeInTheDocument();

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

	it('handles sessions with only one breast type', () => {
		const leftOnlySessions: FeedingSession[] = [
			{ ...mockSessions[0], breast: 'left' },
			{ ...mockSessions[2], breast: 'left' },
		]; // Total 2, Left 2, Right 0
		const { container } = render(
			<TotalFeedingsStats sessions={leftOnlySessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		const totalFeedingsValue = within(statsCard).getByText(
			(content, element) => {
				return (
					element?.tagName.toLowerCase() === 'div' &&
					element.classList.contains('text-2xl') &&
					content === '2'
				);
			},
		);
		expect(totalFeedingsValue).toBeInTheDocument(); // Total count

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
			{ ...mockSessions[0], breast: 'bottle' as FeedingSession['breast'] },
			{ ...mockSessions[1], breast: 'bottle' as FeedingSession['breast'] },
		]; // Total 2, Left 0, Right 0
		const { container } = render(
			<TotalFeedingsStats sessions={bottleOnlySessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		const totalFeedingsValue = within(statsCard).getByText(
			(content, element) => {
				return (
					element?.tagName.toLowerCase() === 'div' &&
					element.classList.contains('text-2xl') &&
					content === '2'
				);
			},
		);
		expect(totalFeedingsValue).toBeInTheDocument(); // Total

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
		]; // Total 1, Right 1, Left 0
		const { container } = render(
			<TotalFeedingsStats sessions={singleSession} />,
		);
		const statsCard = container.firstChild as HTMLElement;

		const totalFeedingsValue = within(statsCard).getByText(
			(content, element) => {
				return (
					element?.tagName.toLowerCase() === 'div' &&
					element.classList.contains('text-2xl') &&
					content === '1'
				);
			},
		);
		expect(totalFeedingsValue).toBeInTheDocument(); // Total

		const leftBreastLabelDiv = within(statsCard)
			.getByText(/Left Breast:/)
			.closest('div');
		expect(within(leftBreastLabelDiv!).getByText('0')).toBeInTheDocument();

		const rightBreastLabelDiv = within(statsCard)
			.getByText(/Right Breast:/)
			.closest('div');
		expect(within(rightBreastLabelDiv!).getByText('1')).toBeInTheDocument();
	});

	afterEach(() => {
		cleanup();
	});
});
