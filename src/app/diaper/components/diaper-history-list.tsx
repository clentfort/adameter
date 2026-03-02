import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { format, isValid, parseISO } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo, useState } from 'react';
import { useStore } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import Markdown from '@/components/markdown';
import {
	useDiaperChangeRow,
	useDiaperChanges,
} from '@/hooks/use-diaper-changes';
import { useDiaperProducts } from '@/hooks/use-diaper-products';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';
import DiaperForm from './diaper-form';

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

export default function DiaperHistoryList() {
	const [changeToDelete, setChangeToDelete] = useState<string | null>(null);
	const [changeToEdit, setChangeToEdit] = useState<DiaperChange | null>(null);
	const { historyRowIds: rowIds, remove, update } = useDiaperChanges();
	const { rowIds: productIds } = useDiaperProducts();
	const store = useStore()!;

	const products = useMemo(
		() =>
			productIds.map(
				(id) =>
					({
						...store.getRow(TABLE_IDS.DIAPER_PRODUCTS, id),
						id,
					}) as DiaperProduct,
			),
		[productIds, store],
	);

	const changesStub = useMemo(
		() => rowIds.map((id) => ({ id })) as unknown as DiaperChange[],
		[rowIds],
	);

	return (
		<>
			<HistoryListInternal
				dateAccessor={(change) => change.id}
				entries={changesStub}
			>
				{(change) => (
					<DiaperHistoryEntry
						changeId={change.id}
						onDelete={remove}
						onEdit={setChangeToEdit}
						products={products}
					/>
				)}
			</HistoryListInternal>
			{changeToDelete && (
				<DeleteEntryDialog
					entry={changeToDelete}
					onClose={() => setChangeToDelete(null)}
					onDelete={(id) => remove(id)}
				/>
			)}
			{changeToEdit && (
				<DiaperForm
					change={changeToEdit}
					onClose={() => setChangeToEdit(null)}
					onSave={update}
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

interface DiaperHistoryEntryProps {
	changeId: string;
	onDelete: (id: string) => void;
	onEdit: (change: DiaperChange) => void;
	products: DiaperProduct[];
}

function DiaperHistoryEntry({
	changeId,
	onDelete,
	onEdit,
	products,
}: DiaperHistoryEntryProps) {
	const change = useDiaperChangeRow(changeId);

	const hasDiaper = change.containsUrine || change.containsStool;
	const hasPotty = change.pottyUrine || change.pottyStool;
	const isStool = change.containsStool || change.pottyStool;

	const borderColor = isStool
		? 'border-amber-700/30'
		: hasPotty && !hasDiaper
			? 'border-blue-400/30'
			: 'border-yellow-400/30';
	const bgColor = isStool
		? 'bg-amber-700/5'
		: hasPotty && !hasDiaper
			? 'bg-blue-400/5'
			: 'bg-yellow-400/5';
	const textColor = isStool
		? 'text-amber-700'
		: hasPotty && !hasDiaper
			? 'text-blue-700'
			: 'text-yellow-800';

	return (
		<div
			className={`border rounded-lg p-4 shadow-xs ${borderColor} ${bgColor}`}
			data-testid="diaper-history-entry"
		>
			<div className="flex justify-between items-start">
				<div>
					<div
						className={`font-medium ${textColor} flex flex-wrap items-center gap-x-3 gap-y-1`}
					>
						{hasDiaper && (
							<div className="flex items-center gap-1">
								<span className="text-base">👶</span>
								<span className="text-sm">
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
								<span className="text-base">🚽</span>
								<span className="text-sm">
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
								<span className="text-sm italic">
									<fbt desc="Dry diaper">Dry</fbt>
								</span>
							</div>
						)}
					</div>
					<p className="text-xs text-muted-foreground">
						{formatChangeTime(change.timestamp)}
					</p>

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
								:{' '}
								<span className="font-medium">{change.temperature} °C</span>
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
									{products.find((p) => p.id === change.diaperProductId)
										?.name || fbt('Unknown Product', 'Label for missing product')}
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
				</div>
				<div className="flex gap-1 mt-2">
					<EditIconButton onClick={() => onEdit(change)} />
					<DeleteIconButton onClick={() => onDelete(change.id)} />
				</div>
			</div>
		</div>
	);
}
