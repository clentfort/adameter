'use client';

import type { JSX } from 'react';
import type { TimeRange } from '@/utils/get-range-dates';
import { addDays, isWithinInterval } from 'date-fns';
import { useMemo, useState, useTransition } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiaperChangesSnapshot } from '@/hooks/use-diaper-changes';
import { useDiaperProductsSnapshot } from '@/hooks/use-diaper-products';
import { useEventsSnapshot } from '@/hooks/use-events';
import { useFeedingSessionsSnapshot } from '@/hooks/use-feeding-sessions';
import { useGrowthMeasurementsSnapshot } from '@/hooks/use-growth-measurements';
import { cn } from '@/lib/utils';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { getRangeDates } from '@/utils/get-range-dates';
import AvgDiaperChangesStats from './components/avg-diaper-changes-stats';
import DeferredSection from './components/deferred-section';
import DiaperActivity from './components/diaper-activity';
import DiaperCostStats from './components/diaper-cost-stats';
import DiaperRecords from './components/diaper-records';
import DurationStats from './components/duration-stats';
import FeedingActivity from './components/feeding-activity';
import FeedingRecords from './components/feeding-records';
import FeedingsPerDayStats from './components/feedings-per-day-stats';
import GrowthChart from './components/growth-chart';
import HeatMap from './components/heat-map';
import PottyRecords from './components/potty-records';
import PottySavingsStats from './components/potty-savings-stats';
import PottySuccessStats from './components/potty-success-stats';
import ReusableSavingsCard from './components/reusable-savings-card';
import TimeBetweenDiaperChangesStats from './components/time-between-diaper-changes-stats';
import TimeBetweenStats from './components/time-between-stats';
import TimeRangePicker from './components/time-range-picker';
import TotalDiaperChangesStats from './components/total-diaper-changes-stats';
import TotalDurationStats from './components/total-duration-stats';
import TotalFeedingsStats from './components/total-feedings-stats';

export default function StatisticsPage(): JSX.Element {
	const diaperChanges = useDiaperChangesSnapshot();
	const diaperProducts = useDiaperProductsSnapshot();
	useEventsSnapshot();
	const measurements = useGrowthMeasurementsSnapshot();
	const sessions = useFeedingSessionsSnapshot();

	const [isPending, startTransition] = useTransition();
	const [timeRange, setTimeRange] = useState<TimeRange>('7');
	const [customRange, setCustomRange] = useState({
		from: dateToDateInputValue(addDays(new Date(), -7)),
		to: dateToDateInputValue(new Date()),
	});

	const { primary, secondary } = useMemo(
		() =>
			getRangeDates(
				timeRange,
				timeRange === 'custom' ? customRange : undefined,
			),
		[timeRange, customRange],
	);

	// Filter sessions based on selected time range
	const filteredSessions = useMemo(
		() =>
			sessions.filter((session) =>
				isWithinInterval(new Date(session.startTime), {
					end: primary.to,
					start: primary.from,
				}),
			),
		[sessions, primary],
	);

	const comparisonSessions = useMemo(
		() =>
			secondary
				? sessions.filter((session) =>
						isWithinInterval(new Date(session.startTime), {
							end: secondary.to,
							start: secondary.from,
						}),
					)
				: undefined,
		[sessions, secondary],
	);

	// Filter diaper changes based on selected time range
	const filteredDiaperChanges = useMemo(
		() =>
			diaperChanges.filter((change) =>
				isWithinInterval(new Date(change.timestamp), {
					end: primary.to,
					start: primary.from,
				}),
			),
		[diaperChanges, primary],
	);

	const comparisonDiaperChanges = useMemo(
		() =>
			secondary
				? diaperChanges.filter((change) =>
						isWithinInterval(new Date(change.timestamp), {
							end: secondary.to,
							start: secondary.from,
						}),
					)
				: undefined,
		[diaperChanges, secondary],
	);

	const pottyHitsCount = useMemo(
		() =>
			filteredDiaperChanges.filter((c) => c.pottyUrine || c.pottyStool).length,
		[filteredDiaperChanges],
	);

	const productById = useMemo(
		() => new Map(diaperProducts.map((p) => [p.id, p])),
		[diaperProducts],
	);

	const disposableChanges = useMemo(
		() =>
			diaperChanges
				.map((change) => {
					const productId = change.diaperProductId;
					if (!productId) return null;
					const product = productById.get(productId);
					if (!product || product.isReusable || !product.costPerDiaper)
						return null;
					return {
						cost: product.costPerDiaper,
						timestamp: new Date(change.timestamp),
					};
				})
				.filter(
					(item): item is { cost: number; timestamp: Date } => item !== null,
				),
		[diaperChanges, productById],
	);

	return (
		<div className={cn('w-full transition-opacity', isPending && 'opacity-50')}>
			<TimeRangePicker
				customRange={customRange}
				onCustomRangeChange={setCustomRange}
				onTimeRangeChange={(value) => {
					startTransition(() => {
						setTimeRange(value);
					});
				}}
				secondaryRange={secondary}
				timeRange={timeRange}
			/>

			{filteredSessions.length === 0 &&
			filteredDiaperChanges.length === 0 &&
			measurements.length === 0 ? (
				<div
					className="text-center py-8 text-muted-foreground"
					data-testid="no-data-message"
				>
					<fbt desc="Message shown when no data is available for the selected time range on the statistics page">
						No data available for the selected time range.
					</fbt>
				</div>
			) : (
				<>
					<h3 className="text-lg font-medium mt-6 mb-4">
						<fbt desc="Subtitle for the feeding statistics section">
							Feeding
						</fbt>
					</h3>
					{filteredSessions.length > 0 ? (
						<>
							<div className="grid grid-cols-2 gap-4">
								<DurationStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<TotalDurationStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<TimeBetweenStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<FeedingsPerDayStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<TotalFeedingsStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<DeferredSection
									fallback={<Skeleton className="h-32 col-span-2" />}
								>
									<HeatMap className="col-span-2" sessions={filteredSessions} />
								</DeferredSection>
							</div>
							<DeferredSection fallback={<Skeleton className="h-64 mt-4" />}>
								<FeedingActivity
									className="mt-4"
									primaryRange={primary}
									secondaryRange={secondary}
									sessions={sessions}
								/>
							</DeferredSection>
							<div className="grid grid-cols-2 gap-4 mt-4">
								<FeedingRecords sessions={sessions} />
							</div>
						</>
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="Message shown when no feeding data is available for the selected time range">
								No feeding data available for the selected time range.
							</fbt>
						</div>
					)}

					<h3 className="text-lg font-medium mt-8 mb-4">
						<fbt desc="Subtitle for the diaper and potty statistics section">
							Diaper & Potty
						</fbt>
					</h3>
					{filteredDiaperChanges.length > 0 || pottyHitsCount > 0 ? (
						<>
							<div className="grid grid-cols-2 gap-4">
								<TimeBetweenDiaperChangesStats
									comparisonDiaperChanges={comparisonDiaperChanges}
									diaperChanges={filteredDiaperChanges}
								/>
								<AvgDiaperChangesStats
									comparisonDiaperChanges={comparisonDiaperChanges}
									diaperChanges={filteredDiaperChanges}
								/>
								<TotalDiaperChangesStats
									comparisonDiaperChanges={comparisonDiaperChanges}
									diaperChanges={filteredDiaperChanges}
								/>
								<DiaperCostStats
									comparisonDiaperChanges={comparisonDiaperChanges}
									diaperChanges={filteredDiaperChanges}
									products={diaperProducts}
								/>
								<PottySavingsStats
									comparisonDiaperChanges={comparisonDiaperChanges}
									diaperChanges={filteredDiaperChanges}
									disposableChanges={disposableChanges}
								/>
								<PottySuccessStats
									comparisonDiaperChanges={comparisonDiaperChanges}
									diaperChanges={filteredDiaperChanges}
								/>
							</div>

							<DiaperActivity
								className="mt-4"
								diaperChanges={diaperChanges}
								filteredDiaperChanges={filteredDiaperChanges}
								primaryRange={primary}
								products={diaperProducts}
								secondaryRange={secondary}
							/>

							<div className="grid grid-cols-2 gap-4 mt-4">
								<DiaperRecords diaperChanges={diaperChanges} />
								<PottyRecords diaperChanges={diaperChanges} />
							</div>
						</>
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="Message shown when no diaper or potty data is available for the selected time range">
								No diaper or potty data available for the selected time range.
							</fbt>
						</div>
					)}

					<DeferredSection fallback={<Skeleton className="h-48 mt-8" />}>
						<ReusableSavingsCard
							allDiaperChanges={diaperChanges}
							className="mt-8"
							products={diaperProducts}
						/>
					</DeferredSection>

					<h3 className="text-lg font-medium mt-8 mb-4">
						<fbt desc="Subtitle for the growth statistics section">Growth</fbt>
					</h3>
					{measurements.length > 0 ? (
						<DeferredSection
							fallback={
								<div className="space-y-4">
									<Skeleton className="h-64" />
									<Skeleton className="h-64" />
									<Skeleton className="h-64" />
								</div>
							}
						>
							<GrowthChart measurements={[...measurements]} />
						</DeferredSection>
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="Message shown when no growth data is available">
								No growth data available.
							</fbt>
						</div>
					)}
				</>
			)}
		</div>
	);
}
