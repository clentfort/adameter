'use client';

import type { FeedingSession } from '@/types/feeding';
import type { DateRange } from '@/utils/get-range-dates';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FeedingActivityChart from './feeding-activity-chart';
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
		<Card className={className}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the feeding activity card showing Duration and Frequency tabs">
						Feeding Activity
					</fbt>
				</CardTitle>
				<CardDescription>
					<fbt desc="Description for the feeding activity card">
						Visualize total duration and frequency of feedings.
					</fbt>
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
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
			</CardContent>
		</Card>
	);
}
