'use client';

import {
	useDiaperChangesToday,
	useDiaperChangesTotal,
	useFeedingSessionsToday,
	useFeedingSessionsTotal,
	useGrowthMaxWeight,
	useTeethEruptedCount,
} from '@/hooks/use-tinybase-metrics';
import StatsCard from './stats-card';

export default function StatisticsSummary() {
	const diaperChangesToday = useDiaperChangesToday();
	const diaperChangesTotal = useDiaperChangesTotal();
	const feedingSessionsToday = useFeedingSessionsToday();
	const feedingSessionsTotal = useFeedingSessionsTotal();
	const teethCount = useTeethEruptedCount();
	const maxWeight = useGrowthMaxWeight();

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			<StatsCard
				title={
					<fbt desc="Title for the diaper changes summary">Diaper Changes</fbt>
				}
			>
				<div className="text-2xl font-bold">{diaperChangesToday}</div>
				<div className="text-xs text-muted-foreground">
					<fbt desc="Label for total diaper changes">
						<fbt:param name="total">{diaperChangesTotal}</fbt:param> total
					</fbt>
				</div>
			</StatsCard>
			<StatsCard
				title={
					<fbt desc="Title for the feeding sessions summary">Feedings</fbt>
				}
			>
				<div className="text-2xl font-bold">{feedingSessionsToday}</div>
				<div className="text-xs text-muted-foreground">
					<fbt desc="Label for total feedings">
						<fbt:param name="total">{feedingSessionsTotal}</fbt:param> total
					</fbt>
				</div>
			</StatsCard>
			<StatsCard title={<fbt desc="Title for the teething summary">Teeth</fbt>}>
				<div className="text-2xl font-bold">{teethCount}</div>
				<div className="text-xs text-muted-foreground">
					<fbt desc="Label for erupted teeth">erupted</fbt>
				</div>
			</StatsCard>
			<StatsCard
				title={<fbt desc="Title for the max weight summary">Max Weight</fbt>}
			>
				<div className="text-2xl font-bold">{maxWeight}</div>
				<div className="text-xs text-muted-foreground">
					<fbt desc="Label for max weight">grams</fbt>
				</div>
			</StatsCard>
		</div>
	);
}
