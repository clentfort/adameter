import type { DiaperChange } from '@/types/diaper';
import { format, isValid, parseISO } from 'date-fns';
import { useMemo } from 'react';
import StatsCard from './stats-card';

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

function formatDay(dayKey: string) {
	const parsedDay = parseISO(dayKey);
	if (!isValid(parsedDay)) {
		return dayKey;
	}

	return format(parsedDay, 'PP');
}

interface DiaperRecordsProps {
	diaperChanges: readonly DiaperChange[];
}

export default function DiaperRecords({
	diaperChanges = [],
}: DiaperRecordsProps) {

	const todayKey = format(new Date(), 'yyyy-MM-dd');
	// Group changes by day
	const { fewestChanges, mostChanges } = useMemo(() => {
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
	}, [diaperChanges, todayKey]);

	if (diaperChanges.length === 0 || !mostChanges || !fewestChanges) return null;
	return (
		<>
			<StatsCard
				title={
					<fbt desc="Title for the day with the most diaper changes">
						Most diaper changes in a day
					</fbt>
				}
			>
				<div className="text-2xl font-bold">{mostChanges[1]}</div>
				<div className="text-sm text-muted-foreground">
					{formatDay(mostChanges[0])}
				</div>
			</StatsCard>
			<StatsCard
				title={
					<fbt desc="Title for the day with the fewest diaper changes">
						Fewest diaper changes in a day
					</fbt>
				}
			>
				<div className="text-2xl font-bold">{fewestChanges[1]}</div>
				<div className="text-sm text-muted-foreground">
					{formatDay(fewestChanges[0])}
				</div>
			</StatsCard>
		</>
	);
}
