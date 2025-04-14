'use client';

import type { GrowthMeasurement } from '@/types/growth';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import { Button } from '@/components/ui/button';
import AddGrowthMeasurement from './add-growth-measurement';

interface GrowthMeasurementsListProps {
	measurements: GrowthMeasurement[];
	onMeasurementDelete: (measurementId: string) => void;
	onMeasurementUpdate: (measurement: GrowthMeasurement) => void;
}

export default function GrowthMeasurementsList({
	measurements = [],
	onMeasurementDelete,
	onMeasurementUpdate,
}: GrowthMeasurementsListProps) {
	const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
		null,
	);
	const [measurementToEdit, setMeasurementToEdit] =
		useState<GrowthMeasurement | null>(null);

	// Ensure measurements is an array
	const measurementsArray = Array.isArray(measurements) ? measurements : [];

	if (measurementsArray.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="noMeasurementsRecorded">No measurements recorded yet.</fbt>
			</p>
		);
	}

	const handleDeleteConfirm = () => {
		if (measurementToDelete) {
			onMeasurementDelete(measurementToDelete);
			setMeasurementToDelete(null);
		}
	};

	// Sort measurements by date (newest first)
	const sortedMeasurements = [...measurementsArray].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	return (
		<>
			<div className="space-y-4">
				{sortedMeasurements.map((measurement) => {
					const measurementDate = new Date(measurement.date);

					return (
						<div
							className="border rounded-lg p-4 shadow-sm"
							key={measurement.id}
						>
							<div className="flex justify-between items-start">
								<div>
									<p className="font-medium text-lg">
										{format(measurementDate, 'dd. MMMM yyyy', { locale: de })}
									</p>
									<div className="mt-2 space-y-1">
										{measurement.weight && (
											<p className="text-sm">
												<span className="font-medium">
													<fbt desc="Weight of the baby">Weight</fbt>
												</span>{' '}
												{measurement.weight} g
											</p>
										)}
										{measurement.height && (
											<p className="text-sm">
												<span className="font-medium">
													{<fbt desc="Height if the baby">Height</fbt>}
												</span>{' '}
												{measurement.height} cm
											</p>
										)}
										{measurement.notes && (
											<p className="text-sm text-muted-foreground mt-2">
												{measurement.notes}
											</p>
										)}
									</div>
								</div>
								<div className="flex gap-1">
									<Button
										className="h-7 w-7"
										onClick={() => setMeasurementToEdit(measurement)}
										size="icon"
										variant="ghost"
									>
										<Pencil className="h-4 w-4" />
										<span className="sr-only">
											<fbt common>Edit</fbt>
										</span>
									</Button>
									<Button
										className="h-7 w-7 text-destructive"
										onClick={() => setMeasurementToDelete(measurement.id)}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">
											<fbt common>Delete</fbt>
										</span>
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>
			{measurementToDelete && (
				<DeleteEntryDialog
					entry={measurementToDelete}
					onClose={() => setMeasurementToDelete(null)}
					onDelete={handleDeleteConfirm}
				/>
			)}
			{measurementToEdit && (
				<AddGrowthMeasurement
					measurement={measurementToEdit}
					onClose={() => setMeasurementToEdit(null)}
					onSave={onMeasurementUpdate}
				/>
			)}
		</>
	);
}
