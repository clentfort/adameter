'use client';

import type { Indicator } from 'who-growth-standards';
import type {
	MetricColor,
	RangePoint,
} from '@/app/statistics/components/growth-metric-card';
import type { GrowthMeasurement } from '@/types/growth';
import { addDays, differenceInDays, isAfter, min, startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import GrowthMetricCard from '@/app/statistics/components/growth-metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/use-profile';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { cmToInches, gramsToLbs } from '@/utils/unit-conversions';

interface GrowthChartProps {
	measurements: readonly GrowthMeasurement[];
}

type GrowthMetricField = 'weight' | 'height' | 'headCircumference';

interface GrowthMetricConfig {
	field: GrowthMetricField;
	indicator: Indicator;
	toImperial: (val: number) => number;
	// Factor from the WHO unit to ours (WHO weights are in kg, ours in g)
	whoUnitFactor: number;
}

const GROWTH_METRICS: readonly GrowthMetricConfig[] = [
	{
		field: 'weight',
		indicator: 'wfa',
		toImperial: gramsToLbs,
		whoUnitFactor: 1000,
	},
	{
		field: 'height',
		indicator: 'lhfa',
		toImperial: cmToInches,
		whoUnitFactor: 1,
	},
	{
		field: 'headCircumference',
		indicator: 'hcfa',
		toImperial: cmToInches,
		whoUnitFactor: 1,
	},
] as const;

// The WHO Child Growth Standards cover 0-5 years
const WHO_MAX_AGE_DAYS = 1856;

function isWithinWhoRange(ageInDays: number) {
	return ageInDays >= 0 && ageInDays <= WHO_MAX_AGE_DAYS;
}

const METRIC_CARD_COLORS: Record<GrowthMetricField, MetricColor> = {
	headCircumference: {
		backgroundColor: 'rgba(59, 130, 246, 0.1)',
		borderColor: '#3b82f6',
	},
	height: {
		backgroundColor: 'rgba(236, 72, 153, 0.1)',
		borderColor: '#ec4899',
	},
	weight: {
		backgroundColor: 'rgba(99, 102, 241, 0.1)',
		borderColor: '#6366f1',
	},
};

interface MetricState {
	percentile: number | null;
	range: RangePoint[];
}

type MetricStates = Record<GrowthMetricField, MetricState>;

const INITIAL_METRIC_STATES: MetricStates = {
	headCircumference: { percentile: null, range: [] },
	height: { percentile: null, range: [] },
	weight: { percentile: null, range: [] },
};

const DAYS_PER_MONTH = 30.4375;

function calculateSortedMeasurements(
	measurements: readonly GrowthMeasurement[],
) {
	return [...measurements].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);
}

function calculateForecastAge(
	dob: Date | null,
	sortedMeasurements: readonly GrowthMeasurement[],
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
	sortedMeasurements: readonly GrowthMeasurement[],
	dob: Date | null,
	field: GrowthMetricField,
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

export default function GrowthChart({ measurements }: GrowthChartProps) {
	const [profile] = useProfile();
	const [unitSystem] = useUnitSystem();
	const isImperial = unitSystem === 'imperial';

	const [metricStates, setMetricStates] = useState<MetricStates>(
		INITIAL_METRIC_STATES,
	);

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
		let ignore = false;

		async function loadRanges() {
			if (!dob || !profile?.sex || profile.optedOut) {
				if (!ignore) {
					setMetricStates(INITIAL_METRIC_STATES);
				}
				return;
			}

			// Loaded lazily to keep the bundled WHO tables out of the main chunk
			const { evaluate, valueAtPercentile } =
				await import('who-growth-standards');
			const sex = profile.sex === 'boy' ? 'male' : 'female';

			// Calculate percentiles for the latest measurements
			const latestByField: Partial<
				Record<GrowthMetricField, GrowthMeasurement>
			> = {};
			for (let i = sortedMeasurements.length - 1; i >= 0; i--) {
				const m = sortedMeasurements[i];
				for (const metric of GROWTH_METRICS) {
					const field = metric.field;
					const val = m[field];
					if (!latestByField[field] && val != null && val > 0) {
						latestByField[field] = m;
					}
				}
				if (GROWTH_METRICS.every((metric) => latestByField[metric.field])) {
					break;
				}
			}

			const percentiles: Record<GrowthMetricField, number | null> = {
				headCircumference: null,
				height: null,
				weight: null,
			};

			for (const metric of GROWTH_METRICS) {
				const latest = latestByField[metric.field];
				const val = latest ? latest[metric.field] : undefined;
				if (!latest || val == null || val <= 0) continue;

				const ageInDays = differenceInDays(new Date(latest.date), dob);
				if (!isWithinWhoRange(ageInDays)) continue;

				percentiles[metric.field] = evaluate(
					metric.indicator,
					sex,
					val / metric.whoUnitFactor,
					ageInDays,
				).percentile;
			}

			if (ignore) return;
			setMetricStates((prev) => ({
				headCircumference: {
					...prev.headCircumference,
					percentile: percentiles.headCircumference,
				},
				height: { ...prev.height, percentile: percentiles.height },
				weight: { ...prev.weight, percentile: percentiles.weight },
			}));

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

			const ranges: Record<GrowthMetricField, RangePoint[]> = {
				headCircumference: [],
				height: [],
				weight: [],
			};

			for (const date of points) {
				const ageInDays = differenceInDays(date, dob);
				if (!isWithinWhoRange(ageInDays)) continue;

				for (const metric of GROWTH_METRICS) {
					const valueAt = (percentile: number) =>
						valueAtPercentile(metric.indicator, sex, percentile, ageInDays) *
						metric.whoUnitFactor;
					ranges[metric.field].push({
						x: ageInDays / DAYS_PER_MONTH,
						yMax: valueAt(97),
						yMin: valueAt(3),
					});
				}
			}

			if (!ignore) {
				setMetricStates({
					headCircumference: {
						percentile: percentiles.headCircumference,
						range: ranges.headCircumference,
					},
					height: {
						percentile: percentiles.height,
						range: ranges.height,
					},
					weight: {
						percentile: percentiles.weight,
						range: ranges.weight,
					},
				});
			}
		}

		loadRanges();

		return () => {
			ignore = true;
		};
	}, [dob, profile?.sex, profile?.optedOut, sortedMeasurements]);

	const metricData = useMemo(() => {
		const result = {} as Record<
			GrowthMetricField,
			{
				data: Array<{ x: number; y: number }>;
				displayRange: RangePoint[];
			}
		>;

		for (const metric of GROWTH_METRICS) {
			const rawData = calculateGrowthData(
				sortedMeasurements,
				dob,
				metric.field,
			);
			const data = isImperial
				? rawData.map((point) => ({
						...point,
						y: metric.toImperial(point.y),
					}))
				: rawData;

			const rawRange = metricStates[metric.field].range;
			const displayRange = isImperial
				? rawRange.map((p) => ({
						x: p.x,
						yMax: metric.toImperial(p.yMax),
						yMin: metric.toImperial(p.yMin),
					}))
				: rawRange;

			result[metric.field] = { data, displayRange };
		}

		return result;
	}, [sortedMeasurements, dob, isImperial, metricStates]);

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
			<GrowthMetricCard
				chartTitle={<fbt desc="Chart title for weight">Weight</fbt>}
				color={METRIC_CARD_COLORS.weight}
				data={metricData.weight.data}
				datasetLabel={
					<fbt desc="Dataset label for weight data in the chart legend">
						Weight
					</fbt>
				}
				emptyStateMessage={commonEmptyState}
				forecastAge={dob ? forecastAge : undefined}
				percentile={metricStates.weight.percentile}
				range={metricData.weight.displayRange}
				rangeLabel={rangeLabel}
				title={
					isImperial ? (
						<fbt desc="Title for the weight section in the growth chart in pounds">
							Weight (lbs)
						</fbt>
					) : (
						<fbt desc="Title for the weight section in the growth chart in grams">
							Weight (g)
						</fbt>
					)
				}
				unit={isImperial ? 'lbs' : 'g'}
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
			/>

			<GrowthMetricCard
				chartTitle={<fbt desc="Chart title for height">Height</fbt>}
				color={METRIC_CARD_COLORS.height}
				data={metricData.height.data}
				datasetLabel={
					<fbt desc="Dataset label for height data in the chart legend">
						Height
					</fbt>
				}
				emptyStateMessage={commonEmptyState}
				forecastAge={dob ? forecastAge : undefined}
				percentile={metricStates.height.percentile}
				range={metricData.height.displayRange}
				rangeLabel={rangeLabel}
				title={
					isImperial ? (
						<fbt desc="Title for the height section in the growth chart in inches">
							Height (in)
						</fbt>
					) : (
						<fbt desc="Title for the height section in the growth chart in centimeters">
							Height (cm)
						</fbt>
					)
				}
				unit={isImperial ? 'in' : 'cm'}
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
			/>

			<GrowthMetricCard
				chartTitle={
					<fbt desc="Chart title for head circumference">
						Head Circumference
					</fbt>
				}
				color={METRIC_CARD_COLORS.headCircumference}
				data={metricData.headCircumference.data}
				datasetLabel={
					<fbt desc="Dataset label for head circumference data in the chart legend">
						Head Circumference
					</fbt>
				}
				emptyStateMessage={commonEmptyState}
				forecastAge={dob ? forecastAge : undefined}
				percentile={metricStates.headCircumference.percentile}
				range={metricData.headCircumference.displayRange}
				rangeLabel={rangeLabel}
				title={
					isImperial ? (
						<fbt desc="Title for the head circumference section in the growth chart in inches">
							Head Circumference (in)
						</fbt>
					) : (
						<fbt desc="Title for the head circumference section in the growth chart in centimeters">
							Head Circumference (cm)
						</fbt>
					)
				}
				unit={isImperial ? 'in' : 'cm'}
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
			/>
		</div>
	);
}
