'use client';

import type { TimeRange } from '@/utils/get-range-dates';
import { addDays, format, isWithinInterval } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo, useState, useTransition } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import DiaperBrandStats from './components/diaper-brand-stats';
import DiaperCostChart from './components/diaper-cost-chart';
import DiaperCostStats from './components/diaper-cost-stats';
import DiaperPottyActivityChart from './components/diaper-potty-activity-chart';
import DiaperRecords from './components/diaper-records';
import DiaperYearlyActivity from './components/diaper-yearly-activity';
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
import TotalDiaperChangesStats from './components/total-diaper-changes-stats';
import TotalDurationStats from './components/total-duration-stats';
import TotalFeedingsStats from './components/total-feedings-stats';
import YearlyActivityHeatMap from './components/yearly-activity-heat-map';

export default function StatisticsPage() {
	const diaperChanges = useDiaperChangesSnapshot();
	const diaperProducts = useDiaperProductsSnapshot();
	const events = useEventsSnapshot();
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
			<div
				className="flex flex-col gap-4 mb-6 sticky z-30 bg-background -mx-4 px-4 py-3 border-b shadow-sm transition-all"
				style={
					{
						top: `calc(var(--header-height-expanded) - (var(--header-height-expanded) - var(--header-height-sticky)) * var(--header-scroll-progress))`,
					} as React.CSSProperties
				}
			>
				<div className="flex justify-between items-start">
					<h2 className="text-xl font-semibold pt-1">
						<fbt desc="Title for the statistics page">Statistics</fbt>
					</h2>
					<div className="flex flex-col items-end gap-1">
						<Select
							onValueChange={(value) => {
								if (value) {
									startTransition(() => {
										setTimeRange(value as TimeRange);
									});
								}
							}}
							value={timeRange}
						>
							<SelectTrigger className="w-[140px]">
								<SelectValue
									placeholder={
										<fbt desc="Placeholder text for the time range select input on the statistics page">
											Time Range
										</fbt>
									}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="7">
									<fbt desc="Option to display data for the last 7 days in statistics">
										Last 7 Days
									</fbt>
								</SelectItem>
								<SelectItem value="14">
									<fbt desc="Option to display data for the last 14 days in statistics">
										Last 14 Days
									</fbt>
								</SelectItem>
								<SelectItem value="30">
									<fbt desc="Option to display data for the last 30 days in statistics">
										Last 30 Days
									</fbt>
								</SelectItem>
								<SelectItem value="custom">
									<fbt desc="Option to display a custom time range in statistics">
										Custom Range
									</fbt>
								</SelectItem>
								<SelectItem value="all">
									<fbt desc="Option to display all data in statistics">
										All Data
									</fbt>
								</SelectItem>
							</SelectContent>
						</Select>
						{secondary && (
							<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
								<fbt desc="Label for the comparison date range in statistics">
									Comparing to:{' '}
									<fbt:param name="from">
										{format(secondary.from, 'MMM d')}
									</fbt:param>{' '}
									-{' '}
									<fbt:param name="to">
										{format(secondary.to, 'MMM d')}
									</fbt:param>
								</fbt>
							</div>
						)}
					</div>
				</div>

				{timeRange === 'custom' && (
					<div className="flex items-center gap-4 justify-end">
						<div className="flex items-center gap-2">
							<Label className="text-xs text-muted-foreground" htmlFor="from">
								<fbt desc="Label for the start date of a custom time range">
									From
								</fbt>
							</Label>
							<Input
								className="w-[140px]"
								id="from"
								onChange={(e) =>
									setCustomRange((prev) => ({ ...prev, from: e.target.value }))
								}
								type="date"
								value={customRange.from}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-xs text-muted-foreground" htmlFor="to">
								<fbt desc="Label for the end date of a custom time range">
									To
								</fbt>
							</Label>
							<Input
								className="w-[140px]"
								id="to"
								onChange={(e) =>
									setCustomRange((prev) => ({ ...prev, to: e.target.value }))
								}
								type="date"
								value={customRange.to}
							/>
						</div>
					</div>
				)}
			</div>

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
									className="col-span-2"
									comparisonDiaperChanges={comparisonDiaperChanges}
									diaperChanges={filteredDiaperChanges}
								/>
							</div>

							<Card className="mt-4">
								<CardHeader className="p-4 pb-2">
									<CardTitle className="text-base">
										<fbt desc="Title for the diaper activity card showing Activity, Cost and Brand tabs">
											Diaper Activity
										</fbt>
									</CardTitle>
									<CardDescription>
										<fbt desc="Description for the diaper activity card">
											Visualize diaper changes, costs and brand distribution.
										</fbt>
									</CardDescription>
								</CardHeader>
								<CardContent className="p-0">
									<Tabs className="w-full" defaultValue="activity">
										<div className="px-4 pt-2">
											<TabsList className="flex w-full mb-2">
												<TabsTrigger value="activity">
													<fbt desc="Label for the activity tab in diaper stats">
														Activity
													</fbt>
												</TabsTrigger>
												<TabsTrigger value="cost">
													<fbt desc="Label for the cost tab in diaper stats">
														Cost
													</fbt>
												</TabsTrigger>
												<TabsTrigger value="brand">
													<fbt desc="Label for the brand tab in diaper stats">
														Brand
													</fbt>
												</TabsTrigger>
												<TabsTrigger value="yearly">
													<fbt desc="Label for the yearly tab in diaper stats">
														Yearly
													</fbt>
												</TabsTrigger>
											</TabsList>
										</div>

										<TabsContent className="mt-0" value="activity">
											<DeferredSection
												fallback={<Skeleton className="h-64 px-4 pb-4" />}
											>
												<DiaperPottyActivityChart
													className="px-4 pb-4"
													diaperChanges={diaperChanges}
													primaryRange={primary}
													secondaryRange={secondary}
												/>
											</DeferredSection>
										</TabsContent>
										<TabsContent className="mt-0" value="cost">
											<DeferredSection
												fallback={<Skeleton className="h-64 px-4 pb-4" />}
											>
												<DiaperCostChart
													className="px-4 pb-4"
													diaperChanges={diaperChanges}
													primaryRange={primary}
													products={diaperProducts}
													secondaryRange={secondary}
												/>
											</DeferredSection>
										</TabsContent>
										<TabsContent className="mt-0" value="brand">
											<DeferredSection
												fallback={<Skeleton className="h-64 px-4 pb-4" />}
											>
												<div className="px-4 pb-4">
													<DiaperBrandStats
														diaperChanges={filteredDiaperChanges}
														products={diaperProducts}
													/>
												</div>
											</DeferredSection>
										</TabsContent>
										<TabsContent className="mt-0" value="yearly">
											<DeferredSection
												fallback={<Skeleton className="h-64 px-4 pb-4" />}
											>
												<div className="px-4 pb-4">
													<DiaperYearlyActivity diaperChanges={diaperChanges} />
												</div>
											</DeferredSection>
										</TabsContent>
									</Tabs>
								</CardContent>
							</Card>

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
