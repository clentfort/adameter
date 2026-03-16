import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { fbt } from 'fbtee';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useCell, useStore } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
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
import { formatEntryTime } from '@/utils/format-history-date';
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

	if (!change) {
		return null;
	}

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
		<HistoryEntryCard
			className={`${borderColor} ${bgColor}`}
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
								<span>{change.temperature} °C</span>
							</div>
						</>
					)}
				</div>
			}
			header={
				<div
					className={`font-medium ${textColor} flex flex-wrap items-center gap-x-3 gap-y-1`}
				>
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

	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get('from');
	const to = searchParams.get('to');

	const filteredDateKeys = useMemo(() => {
		if (!from || !to) return dateKeys;

		const fromDate = startOfDay(parseISO(from));
		const toDate = endOfDay(parseISO(to));

		return dateKeys.filter((dateKey) => {
			const date = parseISO(dateKey);
			return date >= fromDate && date <= toDate;
		});
	}, [dateKeys, from, to]);

	const hasNewerEntries = useMemo(() => {
		if ((!from && !to) || filteredDateKeys.length === 0 || dateKeys.length === 0)
			return false;
		return dateKeys[0] > filteredDateKeys[0];
	}, [dateKeys, filteredDateKeys, from, to]);

	return (
		<>
			{hasNewerEntries && (
				<div className="flex justify-center mb-4">
					<button
						className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
						onClick={() => router.push('/diaper')}
						type="button"
					>
						<fbt desc="Button to show newer entries after filtering">
							Show newer entries
						</fbt>
					</button>
				</div>
			)}
			<IndexedHistoryList
				dateKeys={filteredDateKeys}
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
