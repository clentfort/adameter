import type { GrowthMeasurement } from '@/types/growth';
import type { Tooth } from '@/types/teething';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import Markdown from '@/components/markdown';
import { useGrowthMeasurementRow } from '@/hooks/use-growth-measurements';
import { useToothRow } from '@/hooks/use-teething';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getToothName } from '../utils/teething';
import MeasurementForm from './growth-form';
import TeethingForm from './teething-form';

interface GrowthHistoryListProps {
	onMeasurementDelete: (measurementId: string) => void;
	onMeasurementUpdate: (measurement: GrowthMeasurement) => void;
	onToothUpdate: (tooth: Tooth) => void;
}

export default function GrowthHistoryList({
	onMeasurementDelete,
	onMeasurementUpdate,
	onToothUpdate,
}: GrowthHistoryListProps) {
	const measurementIds = useRowIds(TABLE_IDS.GROWTH_MEASUREMENTS);
	const toothIds = useRowIds(TABLE_IDS.TEETHING);
	const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
		null,
	);
	const [measurementToEdit, setMeasurementToEdit] =
		useState<GrowthMeasurement | null>(null);
	const [toothToEdit, setToothToEdit] = useState<Tooth | null>(null);

	const interleavedIds = useMemo(
		() =>
			[
				...measurementIds.map((id) => ({ id, type: 'growth' as const })),
				...toothIds.map((id) => ({ id, type: 'teething' as const })),
			],
		[measurementIds, toothIds],
	);

	if (interleavedIds.length === 0) {
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
				{interleavedIds.map((entry) => {
					if (entry.type === 'growth') {
						return (
							<GrowthEntry
								id={entry.id}
								key={entry.id}
								onDelete={setMeasurementToDelete}
								onEdit={setMeasurementToEdit}
							/>
						);
					} else {
						return (
							<ToothEntry
								id={entry.id}
								key={entry.id}
								onEdit={setToothToEdit}
								onUpdate={onToothUpdate}
							/>
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

interface GrowthEntryProps {
	id: string;
	onDelete: (id: string) => void;
	onEdit: (measurement: GrowthMeasurement) => void;
}

function GrowthEntry({ id, onDelete, onEdit }: GrowthEntryProps) {
	const measurement = useGrowthMeasurementRow(id);
	if (!measurement.date) return null;
	const date = new Date(measurement.date);

	return (
		<div className="border rounded-lg p-4 shadow-xs">
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
					<EditIconButton onClick={() => onEdit(measurement)} />
					<DeleteIconButton onClick={() => onDelete(measurement.id)} />
				</div>
			</div>
		</div>
	);
}

interface ToothEntryProps {
	id: string;
	onEdit: (tooth: Tooth) => void;
	onUpdate: (tooth: Tooth) => void;
}

function ToothEntry({ id, onEdit, onUpdate }: ToothEntryProps) {
	const tooth = useToothRow(id);
	if (!tooth.date) return null;
	const date = new Date(tooth.date);

	return (
		<div className="border rounded-lg p-4 shadow-xs">
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
					<EditIconButton onClick={() => onEdit(tooth)} />
					<DeleteIconButton
						onClick={() =>
							onUpdate({
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
