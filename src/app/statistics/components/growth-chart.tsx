'use client';

import type { GrowthMeasurement } from '@/types/growth';
import { addDays, differenceInDays, isAfter, min, startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import LineChart from '@/components/charts/line-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/use-profile';
import {
	calculateValue,
	getGrowthTable,
	lookupLms,
	Z_3RD,
	Z_97TH,
} from '@/utils/growth-standards';

interface GrowthChartProps {
	measurements: GrowthMeasurement[];
}

interface RangePoint {
	x: number; // Age in months
	yMax: number;
	yMin: number;
}

const DAYS_PER_MONTH = 30.4375;

export default function GrowthChart({ measurements = [] }: GrowthChartProps) {
	const [profile] = useProfile();
	const [weightRange, setWeightRange] = useState<RangePoint[]>([]);
	const [heightRange, setHeightRange] = useState<RangePoint[]>([]);
	const [headRange, setHeadRange] = useState<RangePoint[]>([]);

	const sortedMeasurements = useMemo(
		() =>
			[...measurements].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			),
		[measurements],
	);

	const dob = useMemo(
		() => (profile?.dob ? startOfDay(new Date(profile.dob)) : null),
		[profile],
	);

	const forecastAge = useMemo(() => {
		if (!dob) return undefined;
		const lastMeasureDate =
			sortedMeasurements.length > 0
				? startOfDay(new Date(sortedMeasurements.at(-1).date))
				: dob;
		const endDate = addDays(lastMeasureDate, 30);
		return differenceInDays(endDate, dob) / DAYS_PER_MONTH;
	}, [dob, sortedMeasurements]);

	useEffect(() => {
		async function loadRanges() {
			if (!dob || !profile?.sex || profile.optedOut) {
				setWeightRange([]);
				setHeightRange([]);
				setHeadRange([]);
				return;
			}

			const firstMeasureDate =
				sortedMeasurements.length > 0
					? startOfDay(new Date(sortedMeasurements[0].date))
					: dob;
			const lastMeasureDate =
				sortedMeasurements.length > 0
					? startOfDay(new Date(sortedMeasurements.at(-1).date))
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
			if (differenceInDays(endDate, points.at(-1)) > 0) {
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

	const weightData = useMemo(
		() =>
			sortedMeasurements
				.filter((m) => m.weight !== undefined && m.weight !== null)
				.map((m) => ({
					x: dob
						? differenceInDays(startOfDay(new Date(m.date)), dob) /
							DAYS_PER_MONTH
						: new Date(m.date).getTime(),
					y: m.weight!,
				})),
		[sortedMeasurements, dob],
	);

	const heightData = useMemo(
		() =>
			sortedMeasurements
				.filter((m) => m.height !== undefined && m.height !== null)
				.map((m) => ({
					x: dob
						? differenceInDays(startOfDay(new Date(m.date)), dob) /
							DAYS_PER_MONTH
						: new Date(m.date).getTime(),
					y: m.height!,
				})),
		[sortedMeasurements, dob],
	);

	const headCircumferenceData = useMemo(
		() =>
			sortedMeasurements
				.filter(
					(m) =>
						m.headCircumference !== undefined && m.headCircumference !== null,
				)
				.map((m) => ({
					x: dob
						? differenceInDays(startOfDay(new Date(m.date)), dob) /
							DAYS_PER_MONTH
						: new Date(m.date).getTime(),
					y: m.headCircumference!,
				})),
		[sortedMeasurements, dob],
	);

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
						<fbt desc="Title for the weight section in the growth chart">
							Weight (g)
						</fbt>
					</CardTitle>
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
						rangeData={weightRange}
						rangeLabel={rangeLabel}
						title={<fbt desc="Chart title for weight">Weight</fbt>}
						xAxisLabel={commonXAxisLabel}
						xAxisType={dob ? 'linear' : 'time'}
						yAxisLabel={
							<fbt desc="Label for the Y-axis showing weight in grams">
								Weight (g)
							</fbt>
						}
						yAxisUnit="g"
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						<fbt desc="Title for the height section in the growth chart">
							Height (cm)
						</fbt>
					</CardTitle>
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
						rangeData={heightRange}
						rangeLabel={rangeLabel}
						title={<fbt desc="Chart title for height">Height</fbt>}
						xAxisLabel={commonXAxisLabel}
						xAxisType={dob ? 'linear' : 'time'}
						yAxisLabel={
							<fbt desc="Label for the Y-axis showing height in centimeters">
								Height (cm)
							</fbt>
						}
						yAxisUnit="cm"
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						<fbt desc="Title for the head circumference section in the growth chart">
							Head Circumference (cm)
						</fbt>
					</CardTitle>
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
						rangeData={headRange}
						rangeLabel={rangeLabel}
						title={
							<fbt desc="Chart title for head circumference">
								Head Circumference
							</fbt>
						}
						xAxisLabel={commonXAxisLabel}
						xAxisType={dob ? 'linear' : 'time'}
						yAxisLabel={
							<fbt desc="Label for the Y-axis showing head circumference in centimeters">
								Head Circumference (cm)
							</fbt>
						}
						yAxisUnit="cm"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
