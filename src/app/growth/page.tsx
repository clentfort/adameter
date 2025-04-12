'use client';

import AddGrowthMeasurement from '@/components/add-growth-measurement';
import GrowthMeasurementsList from '@/components/growth-measurements-list';
import GrowthView from '@/components/growth-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';

export default function GrowthPage() {
	const { addMeasurement, deleteMeasurement, measurements, updateMeasurement } =
		useAppState();
	return (
		<div className="w-full">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold">
						<fbt desc="growthTab">Growth</fbt>
					</h2>
					<AddGrowthMeasurement onSave={addMeasurement} />
				</div>
				<Card>
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-base">
							<fbt desc="allMeasurements">All Measurements</fbt>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<GrowthMeasurementsList
							measurements={measurements}
							onMeasurementDelete={deleteMeasurement}
							onMeasurementUpdate={updateMeasurement}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
