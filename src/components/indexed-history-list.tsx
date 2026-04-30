import type { Indexes } from 'tinybase';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useSliceRowIds } from 'tinybase/ui-react';
import { useSelectedProfileId } from '@/hooks/use-selected-profile-id';
import { formatSectionDate } from '@/utils/format-history-date';

const INITIAL_VISIBLE_DATE_SECTIONS = 7;
const DATE_SECTIONS_INCREMENT = 7;

interface DateSectionProps {
	children: (rowId: string) => React.ReactNode;
	dateKey: string;
	indexes: Indexes | undefined;
	indexId: string;
}

function DateSection({
	children,
	dateKey,
	indexes,
	indexId,
}: DateSectionProps) {
	const [selectedProfileId] = useSelectedProfileId();
	const sliceId = useMemo(() => {
		if (selectedProfileId && !dateKey.includes(':')) {
			return `${selectedProfileId}:${dateKey}`;
		}
		return dateKey;
	}, [selectedProfileId, dateKey]);

	const rowIds = useSliceRowIds(indexId, sliceId, indexes);

	return (
		<div className="space-y-2">
			<div className="bg-muted/50 px-4 py-2 rounded-md text-sm font-medium">
				{formatSectionDate(dateKey)}
			</div>
			{rowIds.map((rowId) => (
				<Fragment key={rowId}>{children(rowId)}</Fragment>
			))}
		</div>
	);
}

interface IndexedHistoryListProps {
	children: (rowId: string) => React.ReactNode;
	dateKeys: string[];
	hasMoreNewerInStore?: boolean;
	hasMoreOlderInStore?: boolean;
	indexes: Indexes | undefined;
	indexId: string;
	initialVisibleCount?: number;
	newerRangeDescription?: string;
	olderRangeDescription?: string;
	onLoadMoreNewer?: () => void;
	onLoadMoreOlder?: () => void;
}

/**
 * A history list component that uses TinyBase Indexes for grouping and sorting.
 * Instead of receiving pre-processed entries, it receives the index configuration
 * and renders row IDs from each date slice.
 */
export default function IndexedHistoryList({
	children,
	dateKeys,
	hasMoreNewerInStore,
	hasMoreOlderInStore,
	indexes,
	indexId,
	initialVisibleCount,
	newerRangeDescription,
	olderRangeDescription,
	onLoadMoreNewer,
	onLoadMoreOlder,
}: IndexedHistoryListProps) {
	const [visibleDateSectionsCount, setVisibleDateSectionsCount] = useState(
		initialVisibleCount ?? INITIAL_VISIBLE_DATE_SECTIONS,
	);

	const firstDateKey = dateKeys[0];
	useEffect(() => {
		setVisibleDateSectionsCount(
			initialVisibleCount ?? INITIAL_VISIBLE_DATE_SECTIONS,
		);
	}, [firstDateKey, initialVisibleCount]);

	// Filter out empty date keys (rows with invalid timestamps)
	const validDateKeys = dateKeys.filter((key) => key !== '');

	if (validDateKeys.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Note that no data has been recorded and therefore nothing is displayed yet">
					No data recorded yet.
				</fbt>
			</p>
		);
	}

	const visibleDateKeys = validDateKeys.slice(0, visibleDateSectionsCount);
	const hasMoreInternalOlder = visibleDateSectionsCount < validDateKeys.length;

	const handleShowOlderEntries = () => {
		if (hasMoreInternalOlder) {
			setVisibleDateSectionsCount(
				(previousCount) => previousCount + DATE_SECTIONS_INCREMENT,
			);
		} else if (onLoadMoreOlder) {
			onLoadMoreOlder();
		}
	};

	return (
		<div className="space-y-4">
			{hasMoreNewerInStore && onLoadMoreNewer && (
				<div className="flex justify-center">
					<button
						className="text-xs font-medium text-primary hover:underline bg-primary/5 px-4 py-2 rounded-md border border-primary/10 transition-colors hover:bg-primary/10 flex flex-col items-center"
						onClick={() => onLoadMoreNewer()}
						type="button"
					>
						<fbt desc="Button label to load newer history entries in the history list">
							Show newer entries
						</fbt>
						{newerRangeDescription && (
							<span className="text-[10px] opacity-70">
								{newerRangeDescription}
							</span>
						)}
					</button>
				</div>
			)}

			{visibleDateKeys.map((dateKey) => (
				<DateSection
					dateKey={dateKey}
					indexes={indexes}
					indexId={indexId}
					key={dateKey}
				>
					{children}
				</DateSection>
			))}

			{(hasMoreInternalOlder || hasMoreOlderInStore) && (
				<div className="flex flex-col items-center gap-2">
					{!hasMoreOlderInStore && hasMoreInternalOlder && (
						<p className="text-sm text-muted-foreground">
							<fbt desc="Label showing how many day sections are currently visible in the history list">
								Showing{' '}
								<fbt:param name="visibleDaySections">
									{visibleDateKeys.length}
								</fbt:param>{' '}
								of{' '}
								<fbt:param name="totalDaySections">
									{validDateKeys.length}
								</fbt:param>{' '}
								days
							</fbt>
						</p>
					)}
					<button
						className="text-xs font-medium text-primary hover:underline bg-primary/5 px-4 py-2 rounded-md border border-primary/10 transition-colors hover:bg-primary/10 flex flex-col items-center"
						onClick={handleShowOlderEntries}
						type="button"
					>
						<fbt desc="Button label to load older history entries in the history list">
							Show older entries
						</fbt>
						{olderRangeDescription && (
							<span className="text-[10px] opacity-70">
								{olderRangeDescription}
							</span>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
