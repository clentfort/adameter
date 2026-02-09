import type { DiaperChange } from '@/types/diaper';
import { format, parseISO } from 'date-fns';
import StatsCard from './stats-card';

interface DiaperRecordsProps {
	diaperChanges: readonly DiaperChange[];
}

export default function DiaperRecords({
	diaperChanges = [],
}: DiaperRecordsProps) {
	if (diaperChanges.length === 0) return null;

	const todayKey = format(new Date(), 'yyyy-MM-dd');

	// Group changes by day
	const changesByDay = new Map<string, number>();
	for (const change of diaperChanges) {
		const day = format(new Date(change.timestamp), 'yyyy-MM-dd');
		if (day === todayKey) continue;

		changesByDay.set(day, (changesByDay.get(day) || 0) + 1);
	}

	const days = Array.from(changesByDay.entries());
	if (days.length === 0) return null;

	const mostChanges = days.reduce((a, b) => (a[1] >= b[1] ? a : b));
	const fewestChanges = days.reduce((a, b) => (a[1] <= b[1] ? a : b));

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
					{format(parseISO(mostChanges[0]), 'PP')}
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
					{format(parseISO(fewestChanges[0]), 'PP')}
				</div>
			</StatsCard>
		</>
	);
}
