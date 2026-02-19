'use client';

import type { GrowthMeasurement } from '@/types/growth';
import { addDays, differenceInDays, isAfter, min, startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import LineChart from '@/components/charts/line-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/use-profile';
import { getGrowthRange } from '@/utils/growth-standards';

interface GrowthChartProps {
	measurements: GrowthMeasurement[];
}

interface RangePoint {
	x: Date;
	yMax: number;
	yMin: number;
}

export default function GrowthChart({
	measurements = [],
}: GrowthChartProps) {
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

	const forecastDate = useMemo(() => {
		if (sortedMeasurements.length === 0) return undefined;
		const lastDate = new Date(sortedMeasurements.at(-1).date);
		return addDays(lastDate, 30);
	}, [sortedMeasurements]);

	useEffect(() => {
		async function loadRanges() {
			if (!profile?.dob || !profile?.sex || profile.optedOut) {
				setWeightRange([]);
				setHeightRange([]);
				setHeadRange([]);
				return;
			}

			const dob = startOfDay(new Date(profile.dob));
			const firstMeasureDate = sortedMeasurements.length > 0
				? startOfDay(new Date(sortedMeasurements[0].date))
				: dob;
			const lastMeasureDate = sortedMeasurements.length > 0
				? startOfDay(new Date(sortedMeasurements.at(-1).date))
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
			if (differenceInDays(endDate, points.at(-1)) > 0) {
				points.push(endDate);
			}

			const wRange: RangePoint[] = [];
			const hRange: RangePoint[] = [];
			const hcRange: RangePoint[] = [];

			for (const date of points) {
				const ageInDays = differenceInDays(date, dob);
				if (ageInDays < 0) continue;

				const [w, h, hc] = await Promise.all([
					getGrowthRange('weight-for-age', profile.sex, ageInDays),
					getGrowthRange('length-height-for-age', profile.sex, ageInDays),
					getGrowthRange('head-circumference-for-age', profile.sex, ageInDays),
				]);

				if (w) wRange.push({ x: date, yMax: w.max, yMin: w.min });
				if (h) hRange.push({ x: date, yMax: h.max, yMin: h.min });
				if (hc) hcRange.push({ x: date, yMax: hc.max, yMin: hc.min });
			}

			setWeightRange(wRange);
			setHeightRange(hRange);
			setHeadRange(hcRange);
		}

		loadRanges();
	}, [profile, sortedMeasurements]);

	const weightData = useMemo(
		() =>
			sortedMeasurements
				.filter((m) => m.weight !== undefined && m.weight !== null)
				.map((m) => ({
					x: new Date(m.date),
					y: m.weight!,
				})),
		[sortedMeasurements],
	);

	const heightData = useMemo(
		() =>
			sortedMeasurements
				.filter((m) => m.height !== undefined && m.height !== null)
				.map((m) => ({
					x: new Date(m.date),
					y: m.height!,
				})),
		[sortedMeasurements],
	);

	const headCircumferenceData = useMemo(
		() =>
			sortedMeasurements
				.filter(
					(m) =>
						m.headCircumference !== undefined && m.headCircumference !== null,
				)
				.map((m) => ({
					x: new Date(m.date),
					y: m.headCircumference!,
				})),
		[sortedMeasurements],
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

	const commonXAxisLabel = (
		<fbt desc="Label for the date axis on charts">Datum</fbt>
	);
	const commonEmptyState = (
		<fbt desc="Message shown when no data is available for a specific growth chart (e.g. no weight data)">
			No data available.
		</fbt>
	);

	const rangeLabel = <fbt desc="Label for the expected growth range">Expected Range (3rd-97th percentile)</fbt>;

	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the growth chart card">Growth Chart</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0 space-y-6">
				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="Title for the weight section in the growth chart">
							Weight (g)
						</fbt>
					</h3>
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
						forecastDate={forecastDate}
						rangeData={weightRange}
						rangeLabel={rangeLabel}
						title={<fbt desc="Chart title for weight">Weight</fbt>}
						xAxisLabel={commonXAxisLabel}
						yAxisLabel={
							<fbt desc="Label for the Y-axis showing weight in grams">
								Weight (g)
							</fbt>
						}
						yAxisUnit="g"
					/>
				</div>

				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="Title for the height section in the growth chart">
							Height (cm)
						</fbt>
					</h3>
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
						forecastDate={forecastDate}
						rangeData={heightRange}
						rangeLabel={rangeLabel}
						title={<fbt desc="Chart title for height">Height</fbt>}
						xAxisLabel={commonXAxisLabel}
						yAxisLabel={
							<fbt desc="Label for the Y-axis showing height in centimeters">
								Height (cm)
							</fbt>
						}
						yAxisUnit="cm"
					/>
				</div>

				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="Title for the head circumference section in the growth chart">
							Head Circumference (cm)
						</fbt>
					</h3>
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
						forecastDate={forecastDate}
						rangeData={headRange}
						rangeLabel={rangeLabel}
						title={
							<fbt desc="Chart title for head circumference">
								Head Circumference
							</fbt>
						}
						xAxisLabel={commonXAxisLabel}
						yAxisLabel={
							<fbt desc="Label for the Y-axis showing head circumference in centimeters">
								Head Circumference (cm)
							</fbt>
						}
						yAxisUnit="cm"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
