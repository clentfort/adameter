'use client';

import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import { fbt } from 'fbtee'; // Ensured fbt import is present
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from './line-chart';

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
						<fbt desc="growthChartHeader">Growth Chart</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<p className="text-muted-foreground text-center py-8">
						<fbt desc="noMeasurementsForGrowthChart">
							No measurements available. Add measurements to see the growth
							chart.
						</fbt>
					</p>
				</CardContent>
			</Card>
		);
	}

	const transformMeasurements = (
		dataKey: keyof GrowthMeasurement,
		currentMeasurements: GrowthMeasurement[],
	) => {
		return currentMeasurements
			.filter((m) => m[dataKey] !== undefined && m[dataKey] !== null)
			.map((m) => ({
				x: new Date(m.date),
				y: m[dataKey] as number,
			}));
	};

	const weightData = transformMeasurements('weight', measurements);
	const heightData = transformMeasurements('height', measurements);
	const headCircumferenceData = transformMeasurements(
		'headCircumference',
		measurements,
	);

	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="growthChartHeader">Growth Chart</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0 space-y-6">
				<LineChart
					backgroundColor="rgba(99, 102, 241, 0.1)"
					borderColor="#6366f1"
					chartData={weightData}
					datasetLabel={fbt('Weight (g)', 'Dataset label for weight in grams')}
					events={events}
					title={<fbt desc="weightChartTitle">Weight</fbt>}
					xAxisLabel={fbt('Date', 'X-axis label for date')}
					noDataMessageLabel={fbt('Weight', 'Data type for no data message - weight')}
				/>

				<LineChart
					backgroundColor="rgba(236, 72, 153, 0.1)"
					borderColor="#ec4899"
					chartData={heightData}
					datasetLabel={fbt('Height (cm)', 'Dataset label for height in centimeters')}
					events={events}
					title={<fbt desc="heightChartTitle">Height</fbt>}
					xAxisLabel={fbt('Date', 'X-axis label for date')}
					noDataMessageLabel={fbt('Height', 'Data type for no data message - height')}
				/>

				<LineChart
					backgroundColor="rgba(59, 130, 246, 0.1)" // Tailwind blue-500
					borderColor="#3b82f6" // Tailwind blue-500
					chartData={headCircumferenceData}
					datasetLabel={fbt('Head Circumference (cm)', 'Dataset label for head circumference in centimeters')}
					events={events}
					title={<fbt desc="headCircumferenceChartTitle">Head Circumference</fbt>}
					xAxisLabel={fbt('Date', 'X-axis label for date')}
					noDataMessageLabel={fbt('Head Circumference', 'Data type for no data message - head circumference')}
				/>

				{events.length > 0 && (
					<div className="mt-4 text-xs text-muted-foreground">
						<p>
							<fbt desc="eventsNote">
								* Vertical lines indicate important events.
							</fbt>
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
