import type { GrowthMeasurement } from '@/types/growth';
import type { Tooth } from '@/types/teething';
import { format } from 'date-fns';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import Markdown from '@/components/markdown';
import { getToothName } from '../utils/teething';
import MeasurementForm from './growth-form';
import TeethingForm from './teething-form';

interface GrowthHistoryListProps {
	measurements: ReadonlyArray<GrowthMeasurement>;
	onMeasurementDelete: (measurementId: string) => void;
	onMeasurementUpdate: (measurement: GrowthMeasurement) => void;
	onToothUpdate: (tooth: Tooth) => void;
	teeth: ReadonlyArray<Tooth>;
}

type HistoryEntry =
	| { data: GrowthMeasurement; id: string; type: 'growth' }
	| { data: Tooth; id: string; type: 'teething' };

export default function GrowthHistoryList({
	measurements = [],
	onMeasurementDelete,
	onMeasurementUpdate,
	onToothUpdate,
	teeth = [],
}: GrowthHistoryListProps) {
	const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
		null,
	);
	const [measurementToEdit, setMeasurementToEdit] =
		useState<GrowthMeasurement | null>(null);
	const [toothToEdit, setToothToEdit] = useState<Tooth | null>(null);

	const interleavedEntries: HistoryEntry[] = [
		...measurements.map(
			(m): HistoryEntry => ({ data: m, id: m.id, type: 'growth' }),
		),
		...teeth
			.filter((t) => !!t.date)
			.map(
				(t): HistoryEntry => ({
					data: t,
					id: `tooth-${t.toothId}`,
					type: 'teething',
				}),
			),
	].sort((a, b) => {
		const dateA = new Date(a.data.date!).getTime();
		const dateB = new Date(b.data.date!).getTime();
		return dateB - dateA;
	});

	if (interleavedEntries.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Empty state message when no growth history is recorded">
					No history recorded yet.
				</fbt>
			</p>
		);
	}

	const handleDeleteConfirm = () => {
		if (measurementToDelete) {
			onMeasurementDelete(measurementToDelete);
			setMeasurementToDelete(null);
		}
	};

	return (
		<>
			<div className="space-y-4">
				{interleavedEntries.map((entry) => {
					const date = new Date(entry.data.date!);

					if (entry.type === 'growth') {
						const measurement = entry.data;
						return (
							<div className="border rounded-lg p-4 shadow-xs" key={entry.id}>
								<div className="flex justify-between items-start">
									<div>
										<div className="flex items-center gap-2">
											<span aria-hidden="true" role="img">
												📏
											</span>
											<p className="font-medium text-lg">
												{format(date, 'dd. MMMM yyyy')}
											</p>
										</div>
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
														{<fbt desc="Height of the baby">Height</fbt>}
													</span>{' '}
													{measurement.height} cm
												</p>
											)}
											{measurement.headCircumference && (
												<p className="text-sm">
													<span className="font-medium">
														<fbt desc="Head circumference of the baby">
															Head Circumference
														</fbt>
													</span>{' '}
													{measurement.headCircumference} cm
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
					} else {
						const tooth = entry.data;
						return (
							<div className="border rounded-lg p-4 shadow-xs" key={entry.id}>
								<div className="flex justify-between items-start">
									<div>
										<div className="flex items-center gap-2">
											<span aria-hidden="true" role="img">
												🦷
											</span>
											<p className="font-medium text-lg">
												{format(date, 'dd. MMMM yyyy')}
											</p>
										</div>
										<div className="mt-2 space-y-1">
											<p className="text-sm">
												<fbt desc="Tooth erupted message">
													<fbt:param name="label">
														<span className="font-medium">Tooth Erupted</span>
													</fbt:param>
													:
													<fbt:param name="toothName">
														{getToothName(tooth.toothId)}
													</fbt:param>{' '}
													(<fbt:param name="fdi">{tooth.toothId}</fbt:param>)
												</fbt>
											</p>
											{tooth.notes && (
												<Markdown className="text-sm text-muted-foreground mt-2">
													{tooth.notes}
												</Markdown>
											)}
										</div>
									</div>
									<div className="flex gap-1">
										<EditIconButton onClick={() => setToothToEdit(tooth)} />
										<DeleteIconButton
											onClick={() =>
												onToothUpdate({
													...tooth,
													date: undefined,
													notes: undefined,
												})
											}
										/>
									</div>
								</div>
							</div>
						);
					}
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
									Edit Growth Entry
						</fbt>
					}
				/>
			)}
			{toothToEdit && (
				<TeethingForm
					onClose={() => setToothToEdit(null)}
					onSave={onToothUpdate}
					tooth={toothToEdit}
					toothName={getToothName(toothToEdit.toothId)}
				/>
			)}
		</>
	);
}
