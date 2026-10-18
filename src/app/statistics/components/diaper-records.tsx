import type { DiaperChange } from '@/types/diaper';
import { format, isValid, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { RecordCard } from './record-card';

function getDayKey(timestamp: unknown): string | undefined {
	if (typeof timestamp !== 'string') {
		return undefined;
	}

	const parsedTimestamp = parseISO(timestamp);
	if (!isValid(parsedTimestamp)) {
		return undefined;
	}

	return format(parsedTimestamp, 'yyyy-MM-dd');
}

function parseDay(dayKey: string): Date {
	return parseISO(dayKey);
}

interface DiaperRecordsProps {
	diaperChanges: readonly DiaperChange[];
}

function calculateDiaperStats(
	diaperChanges: readonly DiaperChange[],
	todayKey: string,
) {
	const changesByDay = new Map<string, number>();
	for (const change of diaperChanges) {
		const day = getDayKey(change.timestamp);
		if (!day || day === todayKey) continue;

		changesByDay.set(day, (changesByDay.get(day) || 0) + 1);
	}

	const days = Array.from(changesByDay.entries());
	if (days.length === 0) return { fewestChanges: null, mostChanges: null };

	const mostChanges = days.reduce((a, b) => (a[1] >= b[1] ? a : b));
	const fewestChanges = days.reduce((a, b) => (a[1] <= b[1] ? a : b));

	return { fewestChanges, mostChanges };
}

export default function DiaperRecords({
	diaperChanges = [],
}: DiaperRecordsProps) {
	const todayKey = format(new Date(), 'yyyy-MM-dd');
	// Group changes by day
	const { fewestChanges, mostChanges } = useMemo(
		() => calculateDiaperStats(diaperChanges, todayKey),
		[diaperChanges, todayKey],
	);

	if (diaperChanges.length === 0 || !mostChanges || !fewestChanges) return null;

	const mostChangesDate = parseDay(mostChanges[0]);
	const fewestChangesDate = parseDay(fewestChanges[0]);

	return (
		<>
			<RecordCard
				date={mostChangesDate}
				title={
					<fbt desc="Title for the day with the most diaper changes">
						Most diaper changes in a day
					</fbt>
				}
				value={mostChanges[1]}
			/>
			<RecordCard
				date={fewestChangesDate}
				title={
					<fbt desc="Title for the day with the fewest diaper changes">
						Fewest diaper changes in a day
					</fbt>
				}
				value={fewestChanges[1]}
			/>
		</>
	);
}
