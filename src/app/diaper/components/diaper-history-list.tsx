import {
	addDays,
	endOfDay,
	format,
	parseISO,
	startOfDay,
	subDays,
} from 'date-fns';
import { fbt } from 'fbtee';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

	const accentColor = '#6366f1'; // indigo-500

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

	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get('from');
	const to = searchParams.get('to');
	const eventTitle = searchParams.get('event');
	const eventColor = searchParams.get('color');

	const effectiveRange = useMemo(() => {
		if (from && to) {
			return {
				from: startOfDay(parseISO(from)),
				to: endOfDay(parseISO(to)),
			};
		}

		// Default to last 7 days
		const end = endOfDay(new Date());
		const start = startOfDay(subDays(end, 6));
		return { from: start, to: end };
	}, [from, to]);

	const filteredDateKeys = useMemo(() => {
		return dateKeys.filter((dateKey) => {
			const date = parseISO(dateKey);
			return date >= effectiveRange.from && date <= effectiveRange.to;
		});
	}, [dateKeys, effectiveRange]);

	const hasMoreNewerInStore = useMemo(() => {
		if (dateKeys.length === 0) return false;
		return parseISO(dateKeys[0]) > effectiveRange.to;
	}, [dateKeys, effectiveRange.to]);

	const hasMoreOlderInStore = useMemo(() => {
		if (dateKeys.length === 0) return false;
		return parseISO(dateKeys.at(-1)!) < effectiveRange.from;
	}, [dateKeys, effectiveRange.from]);

	const updateRange = useCallback(
		(newFrom: Date, newTo: Date) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('from', newFrom.toISOString());
			params.set('to', newTo.toISOString());
			router.replace(`/diaper?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	// Sync default range to URL if missing
	useEffect(() => {
		if (!from || !to) {
			updateRange(effectiveRange.from, effectiveRange.to);
		}
	}, [from, to, effectiveRange.from, effectiveRange.to, updateRange]);

	const handleLoadMoreNewer = () => {
		const nextTo = addDays(effectiveRange.to, 7);
		updateRange(effectiveRange.from, nextTo);
	};

	const handleLoadMoreOlder = () => {
		const nextFrom = subDays(effectiveRange.from, 7);
		updateRange(nextFrom, effectiveRange.to);
	};

	const newerRangeDescription = useMemo(() => {
		if (!hasMoreNewerInStore) return undefined;
		const nextTo = addDays(effectiveRange.to, 7);
		const start = addDays(effectiveRange.to, 1);
		return `${format(start, 'MMM d')} - ${format(nextTo, 'MMM d')}`;
	}, [hasMoreNewerInStore, effectiveRange.to]);

	const olderRangeDescription = useMemo(() => {
		if (!hasMoreOlderInStore) return undefined;
		const nextFrom = subDays(effectiveRange.from, 7);
		const end = subDays(effectiveRange.from, 1);
		return `${format(nextFrom, 'MMM d')} - ${format(end, 'MMM d')}`;
	}, [hasMoreOlderInStore, effectiveRange.from]);

	return (
		<>
			{(from || to) && hasMoreNewerInStore && (
				<HistoryFilterIndicator
					baseUrl="/diaper"
					color={eventColor}
					eventTitle={eventTitle}
					from={effectiveRange.from.toISOString()}
					to={effectiveRange.to.toISOString()}
				/>
			)}

			<IndexedHistoryList
				dateKeys={filteredDateKeys}
				hasMoreNewerInStore={hasMoreNewerInStore}
				hasMoreOlderInStore={hasMoreOlderInStore}
				indexes={indexes}
				indexId={indexId}
				initialVisibleCount={from || to ? filteredDateKeys.length : undefined}
				newerRangeDescription={newerRangeDescription}
				olderRangeDescription={olderRangeDescription}
				onLoadMoreNewer={handleLoadMoreNewer}
				onLoadMoreOlder={handleLoadMoreOlder}
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
