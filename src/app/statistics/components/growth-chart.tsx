'use client';

import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import { useMemo } from 'react';
import LineChart from '@/components/charts/line-chart'; // Import the new chart component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GrowthChartProps {
	events?: Event[];
	measurements: GrowthMeasurement[];
}

export default function GrowthChart({
	events = [],
	measurements = [],
}: GrowthChartProps) {
	// Sort measurements by date (oldest first for the chart)
	const sortedMeasurements = useMemo(
		() =>
			[...measurements].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			),
		[measurements],
	);

	// Prepare data for weight chart
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

	// Prepare data for height chart
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

	// Prepare data for head circumference chart
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

	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the growth chart card">Growth Chart</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0 space-y-6">
				{/* Weight Chart */}
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
						events={events}
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

				{/* Height Chart */}
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
						events={events}
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

				{/* Head Circumference Chart */}
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
						events={events}
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

				{events.length > 0 && (
					<div className="mt-4 text-xs text-muted-foreground">
						<p>
							<fbt desc="Note explaining that vertical lines on the chart indicate important events">
								* Vertical lines indicate important events.
							</fbt>
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
