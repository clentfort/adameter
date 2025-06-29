'use client';

import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
// Ensured fbt import is present
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LineChart from './line-chart'; // Updated import name and path

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
					dataKey="weight"
					events={events}
					label="Weight"
					measurements={measurements}
					title={<fbt desc="weightChartTitle">Weight (g)</fbt>}
					unit="g"
				/>

				<LineChart
					backgroundColor="rgba(236, 72, 153, 0.1)"
					borderColor="#ec4899"
					dataKey="height"
					events={events}
					label="Height"
					measurements={measurements}
					title={<fbt desc="heightChartTitle">Height (cm)</fbt>}
					unit="cm"
				/>

				<LineChart
					backgroundColor="rgba(59, 130, 246, 0.1)" // Tailwind blue-500
					borderColor="#3b82f6" // Tailwind blue-500
					dataKey="headCircumference"
					events={events}
					label="Head Circumference"
					measurements={measurements}
					title={
						<fbt desc="headCircumferenceChartTitle">
							Head Circumference (cm)
						</fbt>
					}
					unit="cm"
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
