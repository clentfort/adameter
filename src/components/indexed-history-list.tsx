import type { Indexes } from 'tinybase';
import React, { Fragment, useEffect, useState } from 'react';
import { useSliceRowIds } from 'tinybase/ui-react';
import { formatSectionDate } from '@/utils/format-history-date';

const INITIAL_VISIBLE_DATE_SECTIONS = 14;
const DATE_SECTIONS_INCREMENT = 14;

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
	const rowIds = useSliceRowIds(indexId, dateKey, indexes);

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
	indexes: Indexes | undefined;
	indexId: string;
}

/**
 * A history list component that uses TinyBase Indexes for grouping and sorting.
 * Instead of receiving pre-processed entries, it receives the index configuration
 * and renders row IDs from each date slice.
 */
export default function IndexedHistoryList({
	children,
	dateKeys,
	indexes,
	indexId,
}: IndexedHistoryListProps) {
	const [visibleDateSectionsCount, setVisibleDateSectionsCount] = useState(
		INITIAL_VISIBLE_DATE_SECTIONS,
	);

	useEffect(() => {
		setVisibleDateSectionsCount(INITIAL_VISIBLE_DATE_SECTIONS);
	}, [dateKeys.length]);

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
	const hasMoreDateSections = visibleDateSectionsCount < validDateKeys.length;

	const handleShowOlderEntries = () => {
		setVisibleDateSectionsCount(
			(previousCount) => previousCount + DATE_SECTIONS_INCREMENT,
		);
	};

	return (
		<div className="space-y-4">
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

			{hasMoreDateSections && (
				<div className="flex flex-col items-center gap-2">
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
					<button
						className="text-sm font-medium text-primary hover:underline"
						onClick={handleShowOlderEntries}
						type="button"
					>
						<fbt desc="Button label to load older history entries in the history list">
							Show older entries
						</fbt>
					</button>
				</div>
			)}
		</div>
	);
}
