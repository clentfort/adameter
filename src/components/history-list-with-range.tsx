'use client';

import type { Indexes } from 'tinybase';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryFilterIndicator from '@/components/history-filter-indicator';
import IndexedHistoryList from '@/components/indexed-history-list';
import { useHistoryRange } from '@/hooks/use-history-range';

interface HistoryListWithRangeProps<TEntity> {
	baseUrl: string;
	children: (
		id: string,
		setters: {
			setToDelete: (id: string) => void;
			setToEdit: (id: string) => void;
		},
	) => React.ReactNode;
	dateKeys: string[];
	editDialog: (id: string, onClose: () => void) => React.ReactNode;
	indexes: Indexes | undefined;
	indexId: string;
	onDelete: (id: string) => void;
}

export default function HistoryListWithRange<TEntity>({
	baseUrl,
	children,
	dateKeys,
	editDialog,
	indexes,
	indexId,
	onDelete,
}: HistoryListWithRangeProps<TEntity>) {
	const [toDeleteId, setToDeleteId] = useState<string | null>(null);
	const [toEditId, setToEditId] = useState<string | null>(null);

	const searchParams = useSearchParams();
	const from = searchParams.get('from');
	const to = searchParams.get('to');
	const eventTitle = searchParams.get('event');
	const eventColor = searchParams.get('color');

	const {
		effectiveRange,
		filteredDateKeys,
		handleLoadMoreNewer,
		handleLoadMoreOlder,
		hasMoreNewerInStore,
		hasMoreOlderInStore,
		newerRangeDescription,
		olderRangeDescription,
	} = useHistoryRange({
		baseUrl,
		dateKeys,
	});

	return (
		<>
			{(from || to) && hasMoreNewerInStore && (
				<HistoryFilterIndicator
					baseUrl={baseUrl}
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
				{(id) =>
					children(id, { setToDelete: setToDeleteId, setToEdit: setToEditId })
				}
			</IndexedHistoryList>

			{toDeleteId && (
				<DeleteEntryDialog
					entry={toDeleteId}
					onClose={() => setToDeleteId(null)}
					onDelete={onDelete}
				/>
			)}

			{toEditId && editDialog(toEditId, () => setToEditId(null))}
		</>
	);
}
