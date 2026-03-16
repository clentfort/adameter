'use client';

import type { GrowthMeasurement } from '@/types/growth';
import { addDays, differenceInDays, isAfter, min, startOfDay } from 'date-fns';
import { Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import LineChart from '@/components/charts/line-chart';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useProfile } from '@/hooks/use-profile';
import { useUnitSystem } from '@/hooks/use-unit-system';
import {
	calculateValue,
	getGrowthTable,
	getPercentile,
	lookupLms,
	Z_3RD,
	Z_97TH,
} from '@/utils/growth-standards';
import { cmToInches, gramsToLbs } from '@/utils/unit-conversions';

interface GrowthChartProps {
	measurements: GrowthMeasurement[];
}

interface RangePoint {
	x: number; // Age in months
	yMax: number;
	yMin: number;
}

const DAYS_PER_MONTH = 30.4375;

function PercentileBadge({ value }: { value: number }) {
	return (
		<Popover>
			<PopoverTrigger
				nativeButton={false}
				render={
					<Badge
						className="cursor-help transition-colors hover:bg-secondary/80"
						variant="secondary"
					>
						<fbt desc="Label for growth percentile">
							P<fbt:param name="percentile">{Math.round(value)}</fbt:param>
						</fbt>
						<Info className="ml-1 size-3" />
					</Badge>
				}
			/>
			<PopoverContent className="w-80">
				<PopoverHeader>
					<PopoverTitle>
						<fbt desc="Title for percentile explanation popover">
							What is a percentile?
						</fbt>
					</PopoverTitle>
				</PopoverHeader>
				<PopoverDescription className="text-xs leading-normal">
					<fbt desc="Explanation of what a growth percentile means">
						A percentile shows how your child&apos;s measurement compares to
						other children of the same age and sex. For example, P50 means your
						child is in the middle: 50% of children are smaller and 50% are
						larger. P95 means your child is larger than 95% of children the same
						age.
					</fbt>
				</PopoverDescription>
			</PopoverContent>
		</Popover>
	);
}

function calculateSortedMeasurements(measurements: GrowthMeasurement[]) {
	return [...measurements].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);
}

function calculateForecastAge(
	dob: Date | null,
	sortedMeasurements: GrowthMeasurement[],
) {
	if (!dob) return undefined;

	const lastMeasurement = sortedMeasurements.at(-1);
	const lastMeasureDate = lastMeasurement
		? startOfDay(new Date(lastMeasurement.date))
		: dob;

	const currentAgeMonths =
		differenceInDays(lastMeasureDate, dob) / DAYS_PER_MONTH;

	return Math.floor(currentAgeMonths / 3) * 3 + 3;
}

function calculateGrowthData(
	sortedMeasurements: GrowthMeasurement[],
	dob: Date | null,
	field: keyof GrowthMeasurement,
) {
	return sortedMeasurements
		.filter((m) => m[field] != null && (m[field] as number) > 0)
		.map((m) => ({
			x: dob
				? differenceInDays(startOfDay(new Date(m.date)), dob) / DAYS_PER_MONTH
				: new Date(m.date).getTime(),
			y: m[field] as number,
		}));
}

export default function GrowthChart({ measurements = [] }: GrowthChartProps) {
	const [profile] = useProfile();
	const unitSystem = useUnitSystem();
	const isImperial = unitSystem === 'imperial';
	const [weightRange, setWeightRange] = useState<RangePoint[]>([]);
	const [heightRange, setHeightRange] = useState<RangePoint[]>([]);
	const [headRange, setHeadRange] = useState<RangePoint[]>([]);
	const [weightPercentile, setWeightPercentile] = useState<number | null>(null);
	const [heightPercentile, setHeightPercentile] = useState<number | null>(null);
	const [headPercentile, setHeadPercentile] = useState<number | null>(null);

	const sortedMeasurements = useMemo(
		() => calculateSortedMeasurements(measurements),
		[measurements],
	);

	const dob = useMemo(
		() => (profile?.dob ? startOfDay(new Date(profile.dob)) : null),
		[profile],
	);

	const forecastAge = useMemo(
		() => calculateForecastAge(dob, sortedMeasurements),
		[dob, sortedMeasurements],
	);

	useEffect(() => {
		async function loadRanges() {
			if (!dob || !profile?.sex || profile.optedOut) {
				setWeightRange([]);
				setHeightRange([]);
				setHeadRange([]);
				setWeightPercentile(null);
				setHeightPercentile(null);
				setHeadPercentile(null);
				return;
			}

			// Calculate percentiles for the latest measurements
			let latestWeight = null;
			let latestHeight = null;
			let latestHead = null;
			for (let i = sortedMeasurements.length - 1; i >= 0; i--) {
				const m = sortedMeasurements[i];
				if (!latestWeight && m.weight != null && m.weight > 0) latestWeight = m;
				if (!latestHeight && m.height != null && m.height > 0) latestHeight = m;
				if (
					!latestHead &&
					m.headCircumference != null &&
					m.headCircumference > 0
				) {
					latestHead = m;
				}
				if (latestWeight && latestHeight && latestHead) break;
			}

			if (latestWeight?.weight && latestWeight.weight > 0) {
				getPercentile(
					'weight-for-age',
					profile.sex,
					differenceInDays(new Date(latestWeight.date), dob),
					latestWeight.weight,
				).then(setWeightPercentile);
			} else {
				setWeightPercentile(null);
			}

			if (latestHeight?.height && latestHeight.height > 0) {
				getPercentile(
					'length-height-for-age',
					profile.sex,
					differenceInDays(new Date(latestHeight.date), dob),
					latestHeight.height,
				).then(setHeightPercentile);
			} else {
				setHeightPercentile(null);
			}

			if (latestHead?.headCircumference && latestHead.headCircumference > 0) {
				getPercentile(
					'head-circumference-for-age',
					profile.sex,
					differenceInDays(new Date(latestHead.date), dob),
					latestHead.headCircumference,
				).then(setHeadPercentile);
			} else {
				setHeadPercentile(null);
			}

			const firstMeasurement = sortedMeasurements[0];
			const lastMeasurement = sortedMeasurements.at(-1);
			const firstMeasureDate = firstMeasurement
				? startOfDay(new Date(firstMeasurement.date))
				: dob;
			const lastMeasureDate = lastMeasurement
				? startOfDay(new Date(lastMeasurement.date))
				: dob;

			const startDate = min([dob, firstMeasureDate]);
			const endDate = addDays(lastMeasureDate, 30);
			const maxAgeInDays = differenceInDays(endDate, dob);

			const points: Date[] = [];
			let current = startDate;
			while (!isAfter(current, endDate)) {
				points.push(current);
				// Sample every 7 days for a smoother curve, especially for infants.
				current = addDays(current, 7);
			}
			// Always include the very end
			const lastPoint = points.at(-1);

			if (!lastPoint || differenceInDays(endDate, lastPoint) > 0) {
				points.push(endDate);
			}

			// Load tables once per indicator based on the maximum age in the range
			const [wTableRes, hTableRes, hcTableRes] = await Promise.all([
				getGrowthTable('weight-for-age', profile.sex, maxAgeInDays),
				getGrowthTable('length-height-for-age', profile.sex, maxAgeInDays),
				getGrowthTable('head-circumference-for-age', profile.sex, maxAgeInDays),
			]);

			const wRange: RangePoint[] = [];
			const hRange: RangePoint[] = [];
			const hcRange: RangePoint[] = [];

			for (const date of points) {
				const ageInDays = differenceInDays(date, dob);
				if (ageInDays < 0) continue;

				const ageInMonths = ageInDays / DAYS_PER_MONTH;

				if (wTableRes) {
					const lms = lookupLms(wTableRes.table, ageInDays);
					if (lms) {
						wRange.push({
							x: ageInMonths,
							yMax: calculateValue(lms.L, lms.M, lms.S, Z_97TH) * 1000,
							yMin: calculateValue(lms.L, lms.M, lms.S, Z_3RD) * 1000,
						});
					}
				}

				if (hTableRes) {
					const lms = lookupLms(hTableRes.table, ageInDays);
					if (lms) {
						hRange.push({
							x: ageInMonths,
							yMax: calculateValue(lms.L, lms.M, lms.S, Z_97TH),
							yMin: calculateValue(lms.L, lms.M, lms.S, Z_3RD),
						});
					}
				}

				if (hcTableRes) {
					const lms = lookupLms(hcTableRes.table, ageInDays);
					if (lms) {
						hcRange.push({
							x: ageInMonths,
							yMax: calculateValue(lms.L, lms.M, lms.S, Z_97TH),
							yMin: calculateValue(lms.L, lms.M, lms.S, Z_3RD),
						});
					}
				}
			}

			setWeightRange(wRange);
			setHeightRange(hRange);
			setHeadRange(hcRange);
		}

		loadRanges();
	}, [dob, profile?.sex, profile?.optedOut, sortedMeasurements]);

	const displayWeightRange = useMemo(
		() =>
			isImperial
				? weightRange.map((p) => ({
						x: p.x,
						yMax: gramsToLbs(p.yMax),
						yMin: gramsToLbs(p.yMin),
					}))
				: weightRange,
		[weightRange, isImperial],
	);

	const displayHeightRange = useMemo(
		() =>
			isImperial
				? heightRange.map((p) => ({
						x: p.x,
						yMax: cmToInches(p.yMax),
						yMin: cmToInches(p.yMin),
					}))
				: heightRange,
		[heightRange, isImperial],
	);

	const displayHeadRange = useMemo(
		() =>
			isImperial
				? headRange.map((p) => ({
						x: p.x,
						yMax: cmToInches(p.yMax),
						yMin: cmToInches(p.yMin),
					}))
				: headRange,
		[headRange, isImperial],
	);

	const weightData = useMemo(() => {
		const data = calculateGrowthData(sortedMeasurements, dob, 'weight');

		if (!isImperial) return data;

		return data.map((point) => ({
			...point,
			y: gramsToLbs(point.y),
		}));
	}, [sortedMeasurements, dob, isImperial]);

	const heightData = useMemo(() => {
		const data = calculateGrowthData(sortedMeasurements, dob, 'height');

		if (!isImperial) return data;

		return data.map((point) => ({
			...point,
			y: cmToInches(point.y),
		}));
	}, [sortedMeasurements, dob, isImperial]);

	const headCircumferenceData = useMemo(() => {
		const data = calculateGrowthData(
			sortedMeasurements,
			dob,
			'headCircumference',
		);

		if (!isImperial) return data;

		return data.map((point) => ({
			...point,
			y: cmToInches(point.y),
		}));
	}, [sortedMeasurements, dob, isImperial]);

	if (measurements.length === 0) {
		return (
			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						<fbt desc="Title for the growth chart card">Growth Chart</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<p className="text-muted-foreground text-center py-8">
						<fbt desc="Message shown when no measurements are available for the growth chart">
							No measurements available. Add measurements to see the growth
							chart.
						</fbt>
					</p>
				</CardContent>
			</Card>
		);
	}

	const commonXAxisLabel = dob ? (
		<fbt desc="Label for the age axis on growth charts">Age (months)</fbt>
	) : (
		<fbt desc="Label for the date axis on charts">Date</fbt>
	);
	const commonEmptyState = (
		<fbt desc="Message shown when no data is available for a specific growth chart (e.g. no weight data)">
			No data available.
		</fbt>
	);

	const rangeLabel = (
		<fbt desc="Label for the expected growth range">
			Expected Range (3rd-97th percentile)
		</fbt>
	);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						{isImperial ? (
							<fbt desc="Title for the weight section in the growth chart in pounds">
								Weight (lbs)
							</fbt>
						) : (
							<fbt desc="Title for the weight section in the growth chart in grams">
								Weight (g)
							</fbt>
						)}
					</CardTitle>
					{weightPercentile !== null && (
						<CardAction>
							<PercentileBadge value={weightPercentile} />
						</CardAction>
					)}
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<LineChart
						backgroundColor="rgba(99, 102, 241, 0.1)"
						borderColor="#6366f1"
						data={weightData}
						datasetLabel={
							<fbt desc="Dataset label for weight data in the chart legend">
								Weight
							</fbt>
						}
						emptyStateMessage={commonEmptyState}
						forecastDate={dob ? forecastAge : undefined}
						rangeData={displayWeightRange}
						rangeLabel={rangeLabel}
						title={<fbt desc="Chart title for weight">Weight</fbt>}
						xAxisLabel={commonXAxisLabel}
						xAxisType={dob ? 'linear' : 'time'}
						yAxisLabel={
							isImperial ? (
								<fbt desc="Label for the Y-axis showing weight in pounds">
									Weight (lbs)
								</fbt>
							) : (
								<fbt desc="Label for the Y-axis showing weight in grams">
									Weight (g)
								</fbt>
							)
						}
						yAxisUnit={isImperial ? 'lbs' : 'g'}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						{isImperial ? (
							<fbt desc="Title for the height section in the growth chart in inches">
								Height (in)
							</fbt>
						) : (
							<fbt desc="Title for the height section in the growth chart in centimeters">
								Height (cm)
							</fbt>
						)}
					</CardTitle>
					{heightPercentile !== null && (
						<CardAction>
							<PercentileBadge value={heightPercentile} />
						</CardAction>
					)}
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<LineChart
						backgroundColor="rgba(236, 72, 153, 0.1)"
						borderColor="#ec4899"
						data={heightData}
						datasetLabel={
							<fbt desc="Dataset label for height data in the chart legend">
								Height
							</fbt>
						}
						emptyStateMessage={commonEmptyState}
						forecastDate={dob ? forecastAge : undefined}
						rangeData={displayHeightRange}
						rangeLabel={rangeLabel}
						title={<fbt desc="Chart title for height">Height</fbt>}
						xAxisLabel={commonXAxisLabel}
						xAxisType={dob ? 'linear' : 'time'}
						yAxisLabel={
							isImperial ? (
								<fbt desc="Label for the Y-axis showing height in inches">
									Height (in)
								</fbt>
							) : (
								<fbt desc="Label for the Y-axis showing height in centimeters">
									Height (cm)
								</fbt>
							)
						}
						yAxisUnit={isImperial ? 'in' : 'cm'}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						{isImperial ? (
							<fbt desc="Title for the head circumference section in the growth chart in inches">
								Head Circumference (in)
							</fbt>
						) : (
							<fbt desc="Title for the head circumference section in the growth chart in centimeters">
								Head Circumference (cm)
							</fbt>
						)}
					</CardTitle>
					{headPercentile !== null && (
						<CardAction>
							<PercentileBadge value={headPercentile} />
						</CardAction>
					)}
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<LineChart
						backgroundColor="rgba(59, 130, 246, 0.1)"
						borderColor="#3b82f6"
						data={headCircumferenceData}
						datasetLabel={
							<fbt desc="Dataset label for head circumference data in the chart legend">
								Head Circumference
							</fbt>
						}
						emptyStateMessage={commonEmptyState}
						forecastDate={dob ? forecastAge : undefined}
						rangeData={displayHeadRange}
						rangeLabel={rangeLabel}
						title={
							<fbt desc="Chart title for head circumference">
								Head Circumference
							</fbt>
						}
						xAxisLabel={commonXAxisLabel}
						xAxisType={dob ? 'linear' : 'time'}
						yAxisLabel={
							isImperial ? (
								<fbt desc="Label for the Y-axis showing head circumference in inches">
									Head Circumference (in)
								</fbt>
							) : (
								<fbt desc="Label for the Y-axis showing head circumference in centimeters">
									Head Circumference (cm)
								</fbt>
							)
						}
						yAxisUnit={isImperial ? 'in' : 'cm'}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
