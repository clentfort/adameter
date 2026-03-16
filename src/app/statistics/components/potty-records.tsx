import type { DiaperChange } from '@/types/diaper';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import StatsCard from './stats-card';

interface PottyRecordsProps {
	diaperChanges: readonly DiaperChange[];
}

export default function PottyRecords({
	diaperChanges = [],
}: PottyRecordsProps) {
	const pottyChanges = useMemo(
		() => diaperChanges.filter((c) => c.pottyUrine || c.pottyStool),
		[diaperChanges],
	);
	const todayKey = format(new Date(), 'yyyy-MM-dd');
	// Group changes by day
	const mostChanges = useMemo(() => {
		const changesByDay = new Map<string, number>();
		for (const change of pottyChanges) {
			const day = format(new Date(change.timestamp), 'yyyy-MM-dd');
			if (day === todayKey) continue;
			changesByDay.set(day, (changesByDay.get(day) || 0) + 1);
		}
		const days = Array.from(changesByDay.entries());
		if (days.length === 0) return null;
		return days.reduce((a, b) => (a[1] >= b[1] ? a : b));
	}, [pottyChanges, todayKey]);
	if (pottyChanges.length === 0 || !mostChanges) return null;
	return (
		<>
			<StatsCard
				title={
					<fbt desc="Title for the day with the most potty successes">
						Most potty hits in a day
					</fbt>
				}
			>
				<div className="text-2xl font-bold">{mostChanges[1]}</div>
				<div className="text-sm text-muted-foreground">
					{format(parseISO(mostChanges[0]), 'PP')}
				</div>
			</StatsCard>
		</>
	);
}
