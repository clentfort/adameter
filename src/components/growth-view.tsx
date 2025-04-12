'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import AddGrowthMeasurement from './add-growth-measurement';
import GrowthMeasurementsList from './growth-measurements-list';

interface GrowthViewProps {
	events: Event[];
	measurements: GrowthMeasurement[];
	onMeasurementAdd: (measurement: GrowthMeasurement) => void;
	onMeasurementDelete: (measurementId: string) => void;
	onMeasurementUpdate: (measurement: GrowthMeasurement) => void;
}

export default function GrowthView({
	events = [],
	measurements = [],
	onMeasurementAdd,
	onMeasurementDelete,
	onMeasurementUpdate,
}: GrowthViewProps) {
	// Ensure measurements is an array
	const measurementsArray = Array.isArray(measurements) ? measurements : [];

	return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold"><fbt desc="growthTab">Growth</fbt></h2>
				<AddGrowthMeasurement onSave={onMeasurementAdd} />
			</div>
            <Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base"><fbt desc="allMeasurements">All Measurements</fbt></CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<GrowthMeasurementsList
						measurements={measurementsArray}
						onMeasurementDelete={onMeasurementDelete}
						onMeasurementUpdate={onMeasurementUpdate}
					/>
				</CardContent>
			</Card>
        </div>
    );
}
