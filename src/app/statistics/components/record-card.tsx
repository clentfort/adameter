import type { JSX, ReactNode } from 'react';
import { format, isValid } from 'date-fns';
import StatsCard from './stats-card';

function formatDateRange(date?: Date, endDate?: Date): string | null {
	if (!date) return null;
	if (!isValid(date)) return null;

	if (!endDate || !isValid(endDate)) {
		return format(date, 'PP');
	}

	const startFormatted = format(date, 'PP');
	const endFormatted = format(endDate, 'PP');

	if (startFormatted === endFormatted) {
		return startFormatted;
	}

	return `${startFormatted} - ${endFormatted}`;
}

export function RecordCard({
	date,
	endDate,
	title,
	value,
}: {
	date?: Date;
	endDate?: Date;
	title: ReactNode;
	value: ReactNode;
}): JSX.Element {
	const formattedDate = formatDateRange(date, endDate);

	return (
		<StatsCard title={title}>
			<div className="text-2xl font-bold">{value}</div>
			{formattedDate && (
				<div className="text-sm text-muted-foreground">{formattedDate}</div>
			)}
		</StatsCard>
	);
}
