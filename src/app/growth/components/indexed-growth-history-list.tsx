'use client';

import type { Indexes } from 'tinybase';
import type { GrowthMeasurement } from '@/types/growth';
import type { Tooth } from '@/types/teething';
import { useMemo, useState } from 'react';
import { useSliceRowIds, useStore } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import Markdown from '@/components/markdown';
import {
	INDEX_IDS,
	useTinybaseIndexes,
} from '@/contexts/tinybase-indexes-context';
import {
	useGrowthMeasurement,
	useRemoveGrowthMeasurement,
	useUpsertGrowthMeasurement,
} from '@/hooks/use-growth-measurements';
import { useTooth, useUpsertTooth } from '@/hooks/use-teething';
import {
	useGrowthMeasurementsByDate,
	useTeethByDate,
} from '@/hooks/use-tinybase-indexes';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	formatDisplayDate,
	formatSectionDate,
} from '@/utils/format-history-date';
import { getToothName } from '../utils/teething';
import MeasurementForm from './growth-form';
import TeethingForm from './teething-form';

interface GrowthHistoryEntryProps {
	onDelete: (id: string) => void;
	onEdit: (measurement: GrowthMeasurement) => void;
	rowId: string;
}

function GrowthHistoryEntry({
	onDelete,
	onEdit,
	rowId,
}: GrowthHistoryEntryProps) {
	const measurement = useGrowthMeasurement(rowId);

	if (!measurement) return null;

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
							{formatDisplayDate(measurement.date)}
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

interface TeethingHistoryEntryProps {
	onDelete: (tooth: Tooth) => void;
	onEdit: (tooth: Tooth) => void;
	rowId: string;
}

function TeethingHistoryEntry({
	onDelete,
	onEdit,
	rowId,
}: TeethingHistoryEntryProps) {
	const tooth = useTooth(rowId);

	if (!tooth || !tooth.date) return null;

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
							{formatDisplayDate(tooth.date)}
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
					<DeleteIconButton onClick={() => onDelete(tooth)} />
				</div>
			</div>
		</div>
	);
}

export default function IndexedGrowthHistoryList() {
	const [measurementToDelete, setMeasurementToDelete] = useState<string | null>(
		null,
	);
	const [measurementToEdit, setMeasurementToEdit] =
		useState<GrowthMeasurement | null>(null);
	const [toothToEdit, setToothToEdit] = useState<Tooth | null>(null);

	const upsertGrowthMeasurement = useUpsertGrowthMeasurement();
	const removeGrowthMeasurement = useRemoveGrowthMeasurement();
	const upsertTooth = useUpsertTooth();

	const { dateKeys: growthDateKeys } = useGrowthMeasurementsByDate();
	const { dateKeys: teethDateKeys } = useTeethByDate();
	const indexes = useTinybaseIndexes();

	const allDateKeys = useMemo(() => {
		const keys = new Set([...growthDateKeys, ...teethDateKeys]);
		return Array.from(keys)
			.filter((k) => k !== '')
			.sort((a, b) => b.localeCompare(a));
	}, [growthDateKeys, teethDateKeys]);

	const handleDeleteConfirm = () => {
		if (measurementToDelete) {
			removeGrowthMeasurement(measurementToDelete);
			setMeasurementToDelete(null);
		}
	};

	if (allDateKeys.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Empty state message when no growth history is recorded">
					No history recorded yet.
				</fbt>
			</p>
		);
	}

	return (
		<>
			<div className="space-y-6">
				{allDateKeys.map((dateKey) => (
					<DateSection
						dateKey={dateKey}
						indexes={indexes}
						key={dateKey}
						onMeasurementDelete={setMeasurementToDelete}
						onMeasurementEdit={setMeasurementToEdit}
						onToothDelete={(tooth) =>
							upsertTooth({ ...tooth, date: undefined, notes: undefined })
						}
						onToothEdit={setToothToEdit}
					/>
				))}
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
					onSave={upsertGrowthMeasurement}
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
					onSave={upsertTooth}
					tooth={toothToEdit}
					toothName={getToothName(toothToEdit.toothId)}
				/>
			)}
		</>
	);
}

interface DateSectionProps {
	dateKey: string;
	indexes: Indexes | undefined;
	onMeasurementDelete: (id: string) => void;
	onMeasurementEdit: (measurement: GrowthMeasurement) => void;
	onToothDelete: (tooth: Tooth) => void;
	onToothEdit: (tooth: Tooth) => void;
}

function DateSection({
	dateKey,
	indexes,
	onMeasurementDelete,
	onMeasurementEdit,
	onToothDelete,
	onToothEdit,
}: DateSectionProps) {
	const growthRowIds = useSliceRowIds(
		INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE,
		dateKey,
		indexes,
	);
	const teethRowIds = useSliceRowIds(INDEX_IDS.TEETH_BY_DATE, dateKey, indexes);
	const store = useStore();

	const interleaved = useMemo(() => {
		const items = [
			...growthRowIds.map((id) => ({
				date: store?.getCell(
					TABLE_IDS.GROWTH_MEASUREMENTS,
					id,
					'date',
				) as string,
				id,
				type: 'growth' as const,
			})),
			...teethRowIds.map((id) => ({
				date: store?.getCell(TABLE_IDS.TEETHING, id, 'date') as string,
				id,
				type: 'teething' as const,
			})),
		];
		return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
	}, [growthRowIds, teethRowIds, store]);

	return (
		<div className="space-y-4">
			<div className="bg-muted/50 px-4 py-2 rounded-md text-sm font-medium">
				{formatSectionDate(dateKey)}
			</div>
			{interleaved.map((item) =>
				item.type === 'growth' ? (
					<GrowthHistoryEntry
						key={item.id}
						onDelete={onMeasurementDelete}
						onEdit={onMeasurementEdit}
						rowId={item.id}
					/>
				) : (
					<TeethingHistoryEntry
						key={item.id}
						onDelete={onToothDelete}
						onEdit={onToothEdit}
						rowId={item.id}
					/>
				),
			)}
		</div>
	);
}
