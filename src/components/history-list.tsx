import { format, parseISO } from 'date-fns';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useSortedEvents } from '@/hooks/use-sorted-events';

const INITIAL_VISIBLE_DATE_SECTIONS = 14;
const DATE_SECTIONS_INCREMENT = 14;

function formatSectionDate(dateKey: string) {
	const parsedDate = parseISO(dateKey);
	if (Number.isNaN(parsedDate.getTime())) {
		return dateKey;
	}

	return format(parsedDate, 'EEEE, d. MMMM yyyy');
}

export interface ItemWithId {
	id: string;
}

interface HistoryListProps<T extends ItemWithId> {
	children: (entry: T) => React.ReactNode;
	dateAccessor: (entry: T) => string;
	entries: ReadonlyArray<T>;
}

export default function HistoryList<T extends ItemWithId>({
	children,
	dateAccessor,
	entries,
}: HistoryListProps<T>) {
	const groupedEvents = useSortedEvents(entries, dateAccessor);
	const [visibleDateSectionsCount, setVisibleDateSectionsCount] = useState(
		INITIAL_VISIBLE_DATE_SECTIONS,
	);

	const dateSections = useMemo(
		() => Object.entries(groupedEvents),
		[groupedEvents],
	);

	useEffect(() => {
		setVisibleDateSectionsCount(INITIAL_VISIBLE_DATE_SECTIONS);
	}, [entries.length]);

	if (dateSections.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Note that no data has been recorded and therefore nothing is displayed yet">
					No data recorded yet.
				</fbt>
			</p>
		);
	}

	const visibleDateSections = dateSections.slice(0, visibleDateSectionsCount);
	const hasMoreDateSections = visibleDateSectionsCount < dateSections.length;

	const handleShowOlderEntries = () => {
		setVisibleDateSectionsCount(
			(previousCount) => previousCount + DATE_SECTIONS_INCREMENT,
		);
	};

	return (
		<div className="space-y-4">
			{visibleDateSections.map(([date, itemsForDate]) => (
				<div className="space-y-2" key={date}>
					<div className="bg-muted/50 px-4 py-2 rounded-md text-sm font-medium">
						{formatSectionDate(date)}
					</div>

					{itemsForDate.map((event) => {
						return <Fragment key={event.id}>{children(event)}</Fragment>;
					})}
				</div>
			))}

			{hasMoreDateSections && (
				<div className="flex flex-col items-center gap-2">
					<p className="text-sm text-muted-foreground">
						<fbt desc="Label showing how many day sections are currently visible in the history list">
							Showing{' '}
							<fbt:param name="visibleDaySections">
								{visibleDateSections.length}
							</fbt:param>{' '}
							of{' '}
							<fbt:param name="totalDaySections">
								{dateSections.length}
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
