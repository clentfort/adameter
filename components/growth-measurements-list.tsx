'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { GrowthMeasurement } from '@/types/growth';
import AddGrowthMeasurement from './add-growth-measurement';
import { useTranslate } from '@/utils/translate';

interface GrowthMeasurementsListProps {
	measurements: GrowthMeasurement[];
	onMeasurementUpdate: (measurement: GrowthMeasurement) => void;
	onMeasurementDelete: (measurementId: string) => void;
}

export default function GrowthMeasurementsList({
	measurements = [],
	onMeasurementUpdate,
	onMeasurementDelete,
}: GrowthMeasurementsListProps) {
	const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
		null,
	);
	const [measurementToEdit, setMeasurementToEdit] =
		useState<GrowthMeasurement | null>(null);
	const t = useTranslate();

	// Ensure measurements is an array
	const measurementsArray = Array.isArray(measurements) ? measurements : [];

	if (measurementsArray.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				{t('noMeasurementsRecorded')}
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
							key={measurement.id}
							className="border rounded-lg p-4 shadow-sm"
						>
							<div className="flex justify-between items-start">
								<div>
									<p className="font-medium text-lg">
										{format(measurementDate, 'dd. MMMM yyyy', { locale: de })}
									</p>
									<div className="mt-2 space-y-1">
										{measurement.weight && (
											<p className="text-sm">
												<span className="font-medium">{`${t('weight').split(' ')[0]}:`}</span>{' '}
												{measurement.weight} g
											</p>
										)}
										{measurement.height && (
											<p className="text-sm">
												<span className="font-medium">{`${t('height').split(' ')[0]}:`}</span>{' '}
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
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => setMeasurementToEdit(measurement)}
									>
										<Pencil className="h-4 w-4" />
										<span className="sr-only">{t('edit')}</span>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 text-destructive"
										onClick={() => setMeasurementToDelete(measurement.id)}
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only">{t('delete')}</span>
									</Button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<AlertDialog
				open={!!measurementToDelete}
				onOpenChange={(open) => !open && setMeasurementToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteMeasurement')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteMeasurementConfirmation')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm}>
							{t('delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{measurementToEdit && (
				<AddGrowthMeasurement
					measurement={measurementToEdit}
					onSave={onMeasurementUpdate}
					onClose={() => setMeasurementToEdit(null)}
				/>
			)}
		</>
	);
}
