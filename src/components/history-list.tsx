import { format, parseISO } from 'date-fns';
import React, { Fragment } from 'react';
import { Event } from '@/types/event'; // Assuming Event type is similar to Entry
import { useSortedEvents } from '@/hooks/useSortedEvents'; // Import the new hook

interface HistoryListProps<T extends Event> {
	children: (entry: T) => React.ReactNode;
	entries: ReadonlyArray<T>;
	// keySelector is no longer needed as sorting/grouping is based on startDate
}

export default function HistoryList<T extends Event>({
	children,
	entries,
}: HistoryListProps<T>) {
	const groupedEvents = useSortedEvents(entries);

	if (Object.keys(groupedEvents).length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Note that no data has been recorded and therefore nothing is displayed yet">
					No data recorded yet.
				</fbt>
			</p>
		);
	}

	// Get sorted dates to ensure the sections are rendered in reverse chronological order
	const sortedDates = Object.keys(groupedEvents).sort(
		(a, b) => parseISO(b).getTime() - parseISO(a).getTime(),
	);

	return (
		<div className="space-y-4">
			{sortedDates.map((date) => (
				<div className="space-y-2" key={date}>
					<div className="bg-muted/50 px-4 py-2 rounded-md text-sm font-medium">
						{/* Date is already 'yyyy-MM-dd', parseISO is needed for format */}
						{format(parseISO(date), 'EEEE, d. MMMM yyyy')}
					</div>

					{groupedEvents[date].map((event) => {
						return <Fragment key={event.id}>{children(event)}</Fragment>;
					})}
				</div>
			))}
		</div>
	);
}
