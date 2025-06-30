'use client';

import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import { fbt } from 'fbtee';
import LineChart from '@/components/charts/line-chart'; // Import the new LineChart component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GrowthChartProps {
	events?: Event[];
	measurements: GrowthMeasurement[];
}

export default function GrowthChart({
	events = [],
	measurements = [],
}: GrowthChartProps) {
	if (measurements.length === 0) {
		return (
			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						<fbt desc="growthChartTitle">Growth Chart</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<p className="text-muted-foreground text-center py-8">
						<fbt desc="noMeasurementsForGrowthChartMessage">
							No measurements available. Add measurements to see the growth
							chart.
						</fbt>
					</p>
				</CardContent>
			</Card>
		);
	}

	// Prepare data for charts
	const sortedMeasurements = [...measurements].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);

	const weightData = sortedMeasurements
		.filter((m) => m.weight !== undefined && m.weight !== null)
		.map((m) => ({
			x: new Date(m.date),
			y: m.weight as number,
		}));

	const heightData = sortedMeasurements
		.filter((m) => m.height !== undefined && m.height !== null)
		.map((m) => ({
			x: new Date(m.date),
			y: m.height as number,
		}));

	const headCircumferenceData = sortedMeasurements
		.filter(
			(m) => m.headCircumference !== undefined && m.headCircumference !== null,
		)
		.map((m) => ({
			x: new Date(m.date),
			y: m.headCircumference as number,
		}));

	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="growthChartTitle">Growth Chart</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0 space-y-6">
				{/* Weight Chart */}
				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="weightChartLabel">Weight</fbt> (
						<fbt desc="gramUnit">g</fbt>)
					</h3>
					<LineChart
						color="#6366f1" // Tailwind indigo-500
						data={weightData}
						events={events}
						label={fbt('Weight', 'Label for weight chart').toString()}
						unit={fbt('g', 'Unit for weight (grams)').toString()}
					/>
				</div>

				{/* Height Chart */}
				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="heightChartLabel">Height</fbt> (
						<fbt desc="cmUnit">cm</fbt>)
					</h3>
					<LineChart
						color="#ec4899" // Tailwind pink-500
						data={heightData}
						events={events}
						label={fbt('Height', 'Label for height chart').toString()}
						unit={fbt('cm', 'Unit for height (centimeters)').toString()}
					/>
				</div>

				{/* Head Circumference Chart */}
				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="headCircumferenceChartLabel">Head Circumference</fbt> (
						<fbt desc="cmUnit">cm</fbt>)
					</h3>
					<LineChart
						color="#3b82f6" // Tailwind blue-500
						data={headCircumferenceData}
						events={events}
						label={fbt(
							'Head Circumference',
							'Label for head circumference chart',
						).toString()}
						unit={fbt(
							'cm',
							'Unit for head circumference (centimeters)',
						).toString()}
					/>
				</div>

				{events.length > 0 && (
					<div className="mt-4 text-xs text-muted-foreground">
						<p>
							<fbt desc="eventsNoteInGrowthChart">
								* Vertical lines indicate important events.
							</fbt>
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
