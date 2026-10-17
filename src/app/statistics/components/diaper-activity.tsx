import type { JSX } from 'react';
import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DeferredSection from './deferred-section';
import DiaperBrandStats from './diaper-brand-stats';
import DiaperCostChart from './diaper-cost-chart';
import DiaperPottyActivityChart from './diaper-potty-activity-chart';
import DiaperYearlyActivity from './diaper-yearly-activity';

interface DiaperActivityProps {
	className?: string;
	diaperChanges: DiaperChange[];
	filteredDiaperChanges: DiaperChange[];
	primaryRange: DateRange;
	products: DiaperProduct[];
	secondaryRange?: DateRange;
}

export default function DiaperActivity({
	className,
	diaperChanges,
	filteredDiaperChanges,
	primaryRange,
	products,
	secondaryRange,
}: DiaperActivityProps): JSX.Element {
	return (
		<Card className={className}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the diaper activity card showing Activity, Cost and Brand tabs">
						Diaper Activity
					</fbt>
				</CardTitle>
				<CardDescription>
					<fbt desc="Description for the diaper activity card">
						Visualize diaper changes, costs and brand distribution.
					</fbt>
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<Tabs className="w-full" defaultValue="activity">
					<div className="px-4 pt-2">
						<TabsList className="flex w-full mb-2">
							<TabsTrigger value="activity">
								<fbt desc="Label for the activity tab in diaper stats">
									Activity
								</fbt>
							</TabsTrigger>
							<TabsTrigger value="cost">
								<fbt desc="Label for the cost tab in diaper stats">Cost</fbt>
							</TabsTrigger>
							<TabsTrigger value="brand">
								<fbt desc="Label for the brand tab in diaper stats">Brand</fbt>
							</TabsTrigger>
							<TabsTrigger value="yearly">
								<fbt desc="Label for the yearly tab in diaper stats">
									Yearly
								</fbt>
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="mt-0" value="activity">
						<DeferredSection fallback={<Skeleton className="h-64 px-4 pb-4" />}>
							<DiaperPottyActivityChart
								className="px-4 pb-4"
								diaperChanges={diaperChanges}
								primaryRange={primaryRange}
								secondaryRange={secondaryRange}
							/>
						</DeferredSection>
					</TabsContent>
					<TabsContent className="mt-0" value="cost">
						<DeferredSection fallback={<Skeleton className="h-64 px-4 pb-4" />}>
							<DiaperCostChart
								className="px-4 pb-4"
								diaperChanges={diaperChanges}
								primaryRange={primaryRange}
								products={products}
								secondaryRange={secondaryRange}
							/>
						</DeferredSection>
					</TabsContent>
					<TabsContent className="mt-0" value="brand">
						<DeferredSection fallback={<Skeleton className="h-64 px-4 pb-4" />}>
							<div className="px-4 pb-4">
								<DiaperBrandStats
									diaperChanges={filteredDiaperChanges}
									products={products}
								/>
							</div>
						</DeferredSection>
					</TabsContent>
					<TabsContent className="mt-0" value="yearly">
						<DeferredSection fallback={<Skeleton className="h-64 px-4 pb-4" />}>
							<div className="px-4 pb-4">
								<DiaperYearlyActivity diaperChanges={diaperChanges} />
							</div>
						</DeferredSection>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
