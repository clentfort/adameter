'use client';

import type { DiaperChange } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PottyActivityChart from './potty-activity-chart';
import StatsCard from './stats-card';
import YearlyActivityHeatMap from './yearly-activity-heat-map';

interface PottyActivityProps {
	className?: string;
	diaperChanges: DiaperChange[];
	primaryRange: DateRange;
	secondaryRange?: DateRange;
}

export default function PottyActivity({
	className,
	diaperChanges,
	primaryRange,
	secondaryRange,
}: PottyActivityProps) {
	return (
		<StatsCard
			accentColor="#1d4ed8"
			className={className}
			description={
				<fbt desc="Description for the potty activity card">
					Visualize frequency of potty successes.
				</fbt>
			}
			title={<fbt desc="Title for the potty activity card">Potty Activity</fbt>}
		>
			<div className="-mx-4">
				<Tabs className="w-full" defaultValue="frequency">
					<div className="px-4 pt-2">
						<TabsList className="flex w-full mb-2">
							<TabsTrigger value="frequency">
								<fbt desc="Label for the frequency tab in potty activity stats">
									Frequency
								</fbt>
							</TabsTrigger>
							<TabsTrigger value="yearly">
								<fbt desc="Label for the yearly tab in potty activity stats">
									Yearly
								</fbt>
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="mt-0" value="frequency">
						<PottyActivityChart
							className="px-4 pb-4"
							diaperChanges={diaperChanges}
							primaryRange={primaryRange}
							secondaryRange={secondaryRange}
						/>
					</TabsContent>
					<TabsContent className="mt-0" value="yearly">
						<YearlyActivityHeatMap
							dates={diaperChanges
								.filter((c) => c.pottyUrine || c.pottyStool)
								.map((c) => c.timestamp)}
							noCard={true}
							palette="diaper"
						/>
					</TabsContent>
				</Tabs>
			</div>
		</StatsCard>
	);
}
