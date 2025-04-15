import groupBy from '@nkzw/core/groupBy';
import { format } from 'date-fns';
import React, { Fragment, useMemo } from 'react';

interface Entry {
	id: string;
}

interface HistoryListProps<T extends Entry> {
	children: (entry: T) => React.ReactNode;
	entries: ReadonlyArray<T>;
	keySelector: (entry: T) => string;
}

export default function HistoryList<T extends Entry>({
	children,
	entries,
	keySelector,
}: HistoryListProps<T>) {
	const groups = useMemo(
		() =>
			Array.from(
				groupBy(entries, (entry) =>
					format(new Date(keySelector(entry)), 'yyyy-MM-dd'),
				),
			),
		[entries, keySelector],
	);

	if (entries.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Note that no data has been recorded and therefore nothing is displayed yet">
					No data recorded yet.
				</fbt>
			</p>
		);
	}

	return (
		<div className="space-y-4">
			{groups.map(([date, entries]) => (
				<div className="space-y-2" key={date}>
					<div className="bg-muted/50 px-4 py-2 rounded-md text-sm font-medium">
						{format(new Date(date), 'EEEE, d. MMMM yyyy')}
					</div>

					{entries.map((session) => {
						return <Fragment key={session.id}>{children(session)}</Fragment>;
					})}
				</div>
			))}
		</div>
	);
}
