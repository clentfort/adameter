'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DiaperActivityChart from './diaper-activity-chart';
import DiaperCostChart from './diaper-cost-chart';
import YearlyActivityHeatMap from './yearly-activity-heat-map';

interface DiaperActivityProps {
	className?: string;
	diaperChanges: DiaperChange[];
	primaryRange: DateRange;
	products: DiaperProduct[];
	secondaryRange?: DateRange;
}

export default function DiaperActivity({
	className,
	diaperChanges,
	primaryRange,
	products,
	secondaryRange,
}: DiaperActivityProps) {
	return (
		<Card className={className}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the diaper activity card">Diaper Activity</fbt>
				</CardTitle>
				<CardDescription>
					<fbt desc="Description for the diaper activity card">
						Visualize frequency and cost of diaper changes.
					</fbt>
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<Tabs className="w-full" defaultValue="frequency">
					<div className="px-4 pt-2">
						<TabsList className="flex w-full mb-2">
							<TabsTrigger value="frequency">
								<fbt desc="Label for the frequency tab in diaper activity stats">
									Frequency
								</fbt>
							</TabsTrigger>
							<TabsTrigger value="cost">
								<fbt desc="Label for the cost tab in diaper activity stats">
									Cost
								</fbt>
							</TabsTrigger>
							<TabsTrigger value="yearly">
								<fbt desc="Label for the yearly tab in diaper activity stats">
									Yearly
								</fbt>
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="mt-0" value="frequency">
						<DiaperActivityChart
							className="px-4 pb-4"
							diaperChanges={diaperChanges}
							primaryRange={primaryRange}
							secondaryRange={secondaryRange}
						/>
					</TabsContent>
					<TabsContent className="mt-0" value="cost">
						<DiaperCostChart
							className="px-4 pb-4"
							diaperChanges={diaperChanges}
							primaryRange={primaryRange}
							products={products}
							secondaryRange={secondaryRange}
						/>
					</TabsContent>
					<TabsContent className="mt-0" value="yearly">
						<YearlyActivityHeatMap
							dates={diaperChanges.map((change) => change.timestamp)}
							noCard={true}
							palette="diaper"
						/>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
