import { format, isValid, parseISO } from 'date-fns';
import { fbt } from 'fbtee';
import { useState } from 'react';
import { useCell, useStore } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import { HistoryEntryCard } from '@/components/history-entry-card';
import IndexedHistoryList from '@/components/indexed-history-list';
import Markdown from '@/components/markdown';
import {
	useDiaperChange,
	useRemoveDiaperChange,
	useUpsertDiaperChange,
} from '@/hooks/use-diaper-changes';
import { useDiaperChangesByDate } from '@/hooks/use-tinybase-indexes';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { cn } from '@/lib/utils';
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

function formatChangeTime(timestamp: unknown) {
	if (typeof timestamp !== 'string') {
		return '';
	}

	const parsedTimestamp = parseISO(timestamp);
	if (!isValid(parsedTimestamp)) {
		return timestamp;
	}

	return format(parsedTimestamp, 'p');
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

	if (!change) {
		return null;
	}

	const hasDiaper = change.containsUrine || change.containsStool;
	const hasPotty = change.pottyUrine || change.pottyStool;
	const isStool = change.containsStool || change.pottyStool;

	const textColor = isStool
		? 'text-amber-700'
		: hasPotty && !hasDiaper
			? 'text-blue-700'
			: 'text-yellow-800';

	return (
		<HistoryEntryCard
			className={cn(
				isStool && 'border-amber-700/30 bg-amber-700/5',
				hasPotty && !hasDiaper && 'border-blue-400/30 bg-blue-400/5',
				!isStool &&
					!(hasPotty && !hasDiaper) &&
					'border-yellow-400/30 bg-yellow-400/5',
			)}
			data-testid="diaper-history-entry"
			emoji={
				<div className="flex items-center gap-0.5">
					{hasDiaper && <span>👶</span>}
					{hasPotty && <span>🚽</span>}
					{!hasDiaper && !hasPotty && <span>🧷</span>}
				</div>
			}
			formattedTime={formatChangeTime(change.timestamp)}
			onDelete={() => onDelete(change.id)}
			onEdit={() => onEdit(change.id)}
			title={
				<div className={cn('font-medium flex flex-col', textColor)}>
					{hasDiaper && (
						<span className="text-sm leading-tight">
							{change.containsUrine && change.containsStool ? (
								<fbt desc="Urine and stool in diaper">Urine & Stool</fbt>
							) : change.containsUrine ? (
								<fbt desc="Urine in diaper">Urine</fbt>
							) : (
								<fbt desc="Stool in diaper">Stool</fbt>
							)}
						</span>
					)}
					{hasPotty && (
						<span className="text-xs leading-tight opacity-90">
							<fbt desc="Label for potty entry">Potty</fbt>:{' '}
							{change.pottyUrine && change.pottyStool ? (
								<fbt desc="Urine and stool in potty">Urine & Stool</fbt>
							) : change.pottyUrine ? (
								<fbt desc="Urine in potty">Urine</fbt>
							) : (
								<fbt desc="Stool in potty">Stool</fbt>
							)}
						</span>
					)}
					{!hasDiaper && !hasPotty && (
						<span className="text-sm italic leading-tight">
							<fbt desc="Dry diaper">Dry</fbt>
						</span>
					)}
				</div>
			}
			variant="diaper"
		>
			<div className="mt-2 text-sm space-y-1">
				{change.temperature && (
					<p
						className={
							isAbnormalTemperature(change.temperature)
								? 'text-red-600 font-medium'
								: ''
						}
					>
						<fbt desc="Label for a measured body temperature in degree Celsius">
							Temperature (°C)
						</fbt>
						: <span className="font-medium">{change.temperature} °C</span>
						{isAbnormalTemperature(change.temperature) && ' (!)'}
					</p>
				)}
				{change.diaperProductId && (
					<p>
						<fbt desc="Label on a field that informs the user about the diaper product used">
							Product
						</fbt>
						:{' '}
						<span className="font-medium">
							<DiaperProductName productId={change.diaperProductId} />
						</span>
					</p>
				)}
				{change.leakage && (
					<p className="text-amber-600 font-medium">
						<fbt desc="Short information text that a diaper has leaked">
							Diaper leaked
						</fbt>
					</p>
				)}
				{change.notes && (
					<div className="text-sm">
						<fbt desc="Prefix to a user defined text on notes on a diaper change (i.e. rashes, redness.)">
							Notes
						</fbt>
						: <Markdown className="text-sm">{change.notes}</Markdown>
					</div>
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
	const { dateKeys, indexes, indexId = '' } = useDiaperChangesByDate();

	return (
		<>
			<IndexedHistoryList
				dateKeys={dateKeys}
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
