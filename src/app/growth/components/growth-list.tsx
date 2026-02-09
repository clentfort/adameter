import type { GrowthMeasurement } from '@/types/growth';
import { format } from 'date-fns';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import Markdown from '@/components/markdown';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { cmToInches, gramsToLbsOz } from '@/utils/unit-conversions';
import MeasurementForm from './growth-form';

interface GrowthMeasurementsListProps {
	measurements: ReadonlyArray<GrowthMeasurement>;
	onMeasurementDelete: (measurementId: string) => void;
	onMeasurementUpdate: (measurement: GrowthMeasurement) => void;
}

export default function GrowthMeasurementsList({
	measurements = [],
	onMeasurementDelete,
	onMeasurementUpdate,
}: GrowthMeasurementsListProps) {
	const unitSystem = useUnitSystem();
	const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
		null,
	);
	const [measurementToEdit, setMeasurementToEdit] =
		useState<GrowthMeasurement | null>(null);

	if (measurements.length === 0) {
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
	const sortedMeasurements = [...measurements].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	return (
		<>
			<div className="space-y-4">
				{sortedMeasurements.map((measurement) => {
					const measurementDate = new Date(measurement.date);

					return (
						<div
							className="border rounded-lg p-4 shadow-xs"
							key={measurement.id}
						>
							<div className="flex justify-between items-start">
								<div>
									<p className="font-medium text-lg">
										{format(measurementDate, 'dd. MMMM yyyy')}
									</p>
									<div className="mt-2 space-y-1">
										{measurement.weight && (
											<p className="text-sm">
												<span className="font-medium">
													<fbt desc="Weight of the baby">Weight</fbt>
												</span>{' '}
												{unitSystem === 'metric' ? (
													<>{measurement.weight} g</>
												) : (
													<>
														{gramsToLbsOz(measurement.weight).lbs} lb{' '}
														{gramsToLbsOz(measurement.weight).oz} oz
													</>
												)}
											</p>
										)}
										{measurement.height && (
											<p className="text-sm">
												<span className="font-medium">
													{<fbt desc="Height of the baby">Height</fbt>}
												</span>{' '}
												{unitSystem === 'metric' ? (
													<>{measurement.height} cm</>
												) : (
													<>{cmToInches(measurement.height)} in</>
												)}
											</p>
										)}
										{measurement.headCircumference && (
											<p className="text-sm">
												<span className="font-medium">
													<fbt desc="Head circumference of the baby">
														Head Circumference
													</fbt>
												</span>{' '}
												{unitSystem === 'metric' ? (
													<>{measurement.headCircumference} cm</>
												) : (
													<>{cmToInches(measurement.headCircumference)} in</>
												)}
											</p>
										)}
										{measurement.notes && (
											<Markdown className="text-sm text-muted-foreground mt-2">
												{measurement.notes}
											</Markdown>
										)}
									</div>
								</div>
								<div className="flex gap-1">
									<EditIconButton
										onClick={() => setMeasurementToEdit(measurement)}
									/>
									<DeleteIconButton
										onClick={() => setMeasurementToDelete(measurement.id)}
									/>
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
				<MeasurementForm
					measurement={measurementToEdit}
					onClose={() => setMeasurementToEdit(null)}
					onSave={onMeasurementUpdate}
					title={
						<fbt desc="Title for dialog to edit a growth measurement">
							Edit Growth Measurement
						</fbt>
					}
				/>
			)}
		</>
	);
}
