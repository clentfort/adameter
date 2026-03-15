'use client';

import type { DiaperChange } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { useMemo } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PottyActivityChart from './potty-activity-chart';
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
	const pottyDates = useMemo(
		() =>
			diaperChanges
				.filter((c) => c.pottyUrine || c.pottyStool)
				.map((c) => c.timestamp),
		[diaperChanges],
	);
	return (
		<Card className={className}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the potty activity card">Potty Activity</fbt>
				</CardTitle>
				<CardDescription>
					<fbt desc="Description for the potty activity card">
						Visualize frequency of potty successes.
					</fbt>
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
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
							dates={pottyDates}
							noCard={true}
							palette="diaper"
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
