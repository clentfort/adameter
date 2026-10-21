import type { DiaperChange } from '@/types/diaper';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { groupByDay, maxEntry, minEntry } from '../utils/group-by-day';
import { RecordCard } from './record-card';

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
	const changesByDay = groupByDay(
		diaperChanges,
		(change) => change.timestamp,
		() => 0,
		(count) => count + 1,
		{ excludeDayKey: todayKey },
	);

	if (changesByDay.size === 0)
		return { fewestChanges: null, mostChanges: null };

	const mostChanges = maxEntry(changesByDay);
	const fewestChanges = minEntry(changesByDay);

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
