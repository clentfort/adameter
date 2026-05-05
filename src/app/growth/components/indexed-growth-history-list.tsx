'use client';

import type { Indexes } from 'tinybase';
import type { GrowthMeasurement } from '@/types/growth';
import type { Tooth } from '@/types/teething';
import { fbt } from 'fbtee';
import { useMemo, useState } from 'react';
import { useSliceRowIds, useStore } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import Markdown from '@/components/markdown';
import { useLanguage } from '@/contexts/i18n-context';
import {
	INDEX_IDS,
	useTinybaseIndexes,
} from '@/contexts/tinybase-indexes-context';
import {
	useGrowthMeasurement,
	useRemoveGrowthMeasurement,
	useUpsertGrowthMeasurement,
} from '@/hooks/use-growth-measurements';
import { useSelectedProfileId } from '@/hooks/use-selected-profile-id';
import { useTooth, useUpsertTooth } from '@/hooks/use-teething';
import {
	useGrowthMeasurementsByDate,
	useTeethByDate,
} from '@/hooks/use-tinybase-indexes';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { formatSectionDate } from '@/utils/format-history-date';
import { cmToInches, gramsToLbsOz } from '@/utils/unit-conversions';
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
	const { locale } = useLanguage();
	const unitSystem = useUnitSystem();
	const isImperial = unitSystem === 'imperial';

	if (!measurement) return null;

	const numberFormat = new Intl.NumberFormat(locale.replace('_', '-'), {
		maximumFractionDigits: 1,
	});

	function formatWeight(grams: number) {
		if (isImperial) {
			const { lbs, oz } = gramsToLbsOz(grams);
			return `${lbs} lbs ${numberFormat.format(oz)} oz`;
		}
		return `${numberFormat.format(grams)} g`;
	}

	function formatLength(cm: number) {
		if (isImperial) {
			return `${numberFormat.format(cmToInches(cm))} in`;
		}
		return `${numberFormat.format(cm)} cm`;
	}

	return (
		<HistoryEntryCard
			accentColor="#059669"
			data-testid="growth-history-entry"
			header={
				<div className="flex items-center gap-2">
					<span aria-hidden="true" role="img">
						📏
					</span>
					<fbt desc="Growth measurement entry title">Measurement</fbt>
				</div>
			}
			onDelete={() => onDelete(measurement.id)}
			onEdit={() => onEdit(measurement)}
		>
			<div className="flex flex-wrap gap-x-2 gap-y-1 text-sm items-center">
				{measurement.weight && (
					<div className="flex items-center gap-1">
						<span title={fbt('Weight', 'Weight tooltip').toString()}>⚖️</span>
						<span>{formatWeight(measurement.weight)}</span>
					</div>
				)}
				{measurement.weight &&
					(measurement.height || measurement.headCircumference) && (
						<span className="text-muted-foreground">•</span>
					)}
				{measurement.height && (
					<div className="flex items-center gap-1">
						<span title={fbt('Height', 'Height tooltip').toString()}>📏</span>
						<span>{formatLength(measurement.height)}</span>
					</div>
				)}
				{measurement.height && measurement.headCircumference && (
					<span className="text-muted-foreground">•</span>
				)}
				{measurement.headCircumference && (
					<div className="flex items-center gap-1">
						<span
							title={fbt(
								'Head Circumference',
								'Head circumference tooltip',
							).toString()}
						>
							🗣️
						</span>
						<span>{formatLength(measurement.headCircumference)}</span>
					</div>
				)}
			</div>
			{measurement.notes && (
				<Markdown className="text-sm text-muted-foreground mt-2">
					{measurement.notes}
				</Markdown>
			)}
		</HistoryEntryCard>
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

	return (
		<HistoryEntryCard
			accentColor="#0284c7"
			header={
				<div className="flex items-center gap-2">
					<span aria-hidden="true" role="img">
						🦷
					</span>
					<fbt desc="Teething entry title">Teething</fbt>
				</div>
			}
			onDelete={() => onDelete(tooth)}
			onEdit={() => onEdit(tooth)}
		>
			<div className="space-y-1 text-sm">
				<p>
					<fbt desc="Tooth name and FDI id">
						<fbt:param name="toothName">
							{getToothName(tooth.toothId)}
						</fbt:param>{' '}
						(<fbt:param name="fdi">{tooth.toothId}</fbt:param>)
					</fbt>
				</p>
				{tooth.notes && (
					<Markdown className="text-muted-foreground mt-2">
						{tooth.notes}
					</Markdown>
				)}
			</div>
		</HistoryEntryCard>
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
	const [selectedProfileId] = useSelectedProfileId();
	const sliceId = useMemo(() => {
		if (selectedProfileId && !dateKey.includes(':')) {
			return `${selectedProfileId}:${dateKey}`;
		}
		return dateKey;
	}, [selectedProfileId, dateKey]);

	const growthRowIds = useSliceRowIds(
		INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE,
		sliceId,
		indexes,
	);
	const teethRowIds = useSliceRowIds(INDEX_IDS.TEETH_BY_DATE, sliceId, indexes);
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
