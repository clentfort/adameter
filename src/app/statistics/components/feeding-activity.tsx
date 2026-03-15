'use client';

import type { FeedingSession } from '@/types/feeding';
import type { DateRange } from '@/utils/get-range-dates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeedingActivityChart from './feeding-activity-chart';
import StatsCard from './stats-card';
import YearlyActivityHeatMap from './yearly-activity-heat-map';

interface FeedingActivityProps {
	className?: string;
	primaryRange: DateRange;
	secondaryRange?: DateRange;
	sessions: FeedingSession[];
}

export default function FeedingActivity({
	className,
	primaryRange,
	secondaryRange,
	sessions,
}: FeedingActivityProps) {
	return (
		<StatsCard
			accentColor="#6366f1"
			className={className}
			description={
				<fbt desc="Description for the feeding activity card">
					Visualize total duration and frequency of feedings.
				</fbt>
			}
			title={
				<fbt desc="Title for the feeding activity card showing Duration and Frequency tabs">
					Feeding Activity
				</fbt>
			}
		>
			<div className="-mx-4">
				<Tabs className="w-full" defaultValue="duration">
					<div className="px-4 pt-2">
						<TabsList className="flex w-full mb-2">
							<TabsTrigger value="duration">
								<fbt desc="Label for the duration tab in feeding activity stats">
									Duration
								</fbt>
							</TabsTrigger>
							<TabsTrigger value="frequency">
								<fbt desc="Label for the frequency tab in feeding activity stats">
									Frequency
								</fbt>
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="mt-0" value="duration">
						<FeedingActivityChart
							className="px-4 pb-4"
							primaryRange={primaryRange}
							secondaryRange={secondaryRange}
							sessions={sessions}
						/>
					</TabsContent>
					<TabsContent className="mt-0" value="frequency">
						<YearlyActivityHeatMap
							dates={sessions.map((session) => session.startTime)}
							noCard={true}
							palette="feeding"
						/>
					</TabsContent>
				</Tabs>
			</div>
		</StatsCard>
	);
}
