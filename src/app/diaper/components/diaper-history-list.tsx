import { fbt } from 'fbtee';
import { useState } from 'react';
import { useCell, useStore } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import HistoryFilterIndicator from '@/components/history-filter-indicator';
import IndexedHistoryList from '@/components/indexed-history-list';
import Markdown from '@/components/markdown';
import {
	useDiaperChange,
	useRemoveDiaperChange,
	useUpsertDiaperChange,
} from '@/hooks/use-diaper-changes';
import { useHistoryRange } from '@/hooks/use-history-range';
import { useDiaperChangesByDate } from '@/hooks/use-tinybase-indexes';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { cn } from '@/lib/utils';
import { formatEntryTime } from '@/utils/format-history-date';
import { celsiusToFahrenheit } from '@/utils/unit-conversions';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';
import DiaperForm from './diaper-form';

function DiaperProductName({ productId }: { productId: string }) {
	const store = useStore()!;
	const productName = useCell(
		TABLE_IDS.DIAPER_PRODUCTS,
		productId,
		'name',
		store,
	);

	return typeof productName === 'string' && productName.length > 0 ? (
		<>{productName}</>
	) : (
		<>{fbt('Unknown Product', 'Label for missing product')}</>
	);
}

function DiaperHistoryEntry({
	changeId,
	onDelete,
	onEdit,
}: {
	changeId: string;
	onDelete: (changeId: string) => void;
	onEdit: (changeId: string) => void;
}) {
	const change = useDiaperChange(changeId);
	const unitSystem = useUnitSystem();
	const isImperial = unitSystem === 'imperial';

	if (!change) {
		return null;
	}

	const hasDiaper = change.containsUrine || change.containsStool;
	const hasPotty = change.pottyUrine || change.pottyStool;
	const isStool = change.containsStool || change.pottyStool;

	const accentColor = isStool
		? '#b45309' // amber-700
		: hasPotty && !hasDiaper
			? '#1d4ed8' // blue-700
			: '#a16207'; // yellow-700

	return (
		<HistoryEntryCard
			accentColor={accentColor}
			data-testid="diaper-history-entry"
			formattedTime={
				<div className="flex items-center gap-2">
					<span>{formatEntryTime(change.timestamp)}</span>
					{change.temperature && (
						<>
							<span className="mx-1">•</span>
							<div
								className={cn(
									'flex items-center gap-0.5',
									isAbnormalTemperature(change.temperature) &&
										'text-red-600 font-medium',
								)}
							>
								<span>🌡️</span>
								<span>
									{isImperial
										? `${celsiusToFahrenheit(change.temperature).toFixed(1)} °F`
										: `${change.temperature} °C`}
								</span>
							</div>
						</>
					)}
				</div>
			}
			header={
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					{hasDiaper && (
						<div className="flex items-center gap-1">
							<span>👶</span>
							<span>
								{change.containsUrine && change.containsStool ? (
									<fbt desc="Urine and stool in diaper">Urine & Stool</fbt>
								) : change.containsUrine ? (
									<fbt desc="Urine in diaper">Urine</fbt>
								) : (
									<fbt desc="Stool in diaper">Stool</fbt>
								)}
							</span>
						</div>
					)}
					{hasPotty && (
						<div className="flex items-center gap-1">
							<span>🚽</span>
							<span>
								{change.pottyUrine && change.pottyStool ? (
									<fbt desc="Urine and stool in potty">Urine & Stool</fbt>
								) : change.pottyUrine ? (
									<fbt desc="Urine in potty">Urine</fbt>
								) : (
									<fbt desc="Stool in potty">Stool</fbt>
								)}
							</span>
						</div>
					)}
					{!hasDiaper && !hasPotty && (
						<div className="flex items-center gap-1">
							<span className="italic">
								<fbt desc="Dry diaper">Dry</fbt>
							</span>
						</div>
					)}
				</div>
			}
			onDelete={() => onDelete(change.id)}
			onEdit={() => onEdit(change.id)}
		>
			<div className="text-sm space-y-1">
				{(change.diaperProductId || change.leakage) && (
					<div className="flex flex-wrap items-center gap-x-2">
						{change.diaperProductId && (
							<span className="font-medium">
								<DiaperProductName productId={change.diaperProductId} />
							</span>
						)}
						{change.diaperProductId && change.leakage && (
							<span className="text-muted-foreground">•</span>
						)}
						{change.leakage && (
							<p className="text-amber-600 font-medium">
								<fbt desc="Short information text that a diaper has leaked">
									leaked
								</fbt>
							</p>
						)}
					</div>
				)}
				{change.notes && (
					<Markdown className="text-sm text-muted-foreground">
						{change.notes}
					</Markdown>
				)}
			</div>
		</HistoryEntryCard>
	);
}

export default function DiaperHistoryList() {
	const [changeToDelete, setChangeToDelete] = useState<string | null>(null);
	const [changeToEditId, setChangeToEditId] = useState<string | null>(null);
	const removeDiaperChange = useRemoveDiaperChange();
	const upsertDiaperChange = useUpsertDiaperChange();
	const changeToEdit = useDiaperChange(changeToEditId ?? undefined);
	const { dateKeys, indexes, indexId } = useDiaperChangesByDate();

	const { historyFilterIndicatorProps, indexedHistoryListProps } =
		useHistoryRange({
			baseUrl: '/diaper',
			dateKeys,
		});

	return (
		<>
			<HistoryFilterIndicator {...historyFilterIndicatorProps} />

			<IndexedHistoryList
				{...indexedHistoryListProps}
				indexes={indexes}
				indexId={indexId}
			>
				{(changeId) => (
					<DiaperHistoryEntry
						changeId={changeId}
						key={changeId}
						onDelete={setChangeToDelete}
						onEdit={setChangeToEditId}
					/>
				)}
			</IndexedHistoryList>
			{changeToDelete && (
				<DeleteEntryDialog
					entry={changeToDelete}
					onClose={() => setChangeToDelete(null)}
					onDelete={removeDiaperChange}
				/>
			)}
			{changeToEdit && (
				<DiaperForm
					change={changeToEdit}
					onClose={() => setChangeToEditId(null)}
					onSave={upsertDiaperChange}
					title={
						<fbt desc="Title for the edit diaper entry dialog">
							Edit Diaper Entry
						</fbt>
					}
				/>
			)}
		</>
	);
}
