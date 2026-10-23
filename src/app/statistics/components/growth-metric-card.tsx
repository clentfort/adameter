'use client';

import { Info } from 'lucide-react';
import LineChart from '@/components/charts/line-chart';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@/components/ui/popover';

export interface RangePoint {
	x: number;
	yMax: number;
	yMin: number;
}

export interface MetricColor {
	backgroundColor: string;
	borderColor: string;
}

export interface GrowthMetricCardProps {
	chartTitle: React.ReactNode;
	color: MetricColor;
	data: Array<{ x: number; y: number }>;
	datasetLabel: React.ReactNode;
	emptyStateMessage: React.ReactNode;
	forecastAge?: number;
	percentile: number | null;
	range: RangePoint[];
	rangeLabel: React.ReactNode;
	title: React.ReactNode;
	unit: string;
	xAxisLabel: React.ReactNode;
	xAxisType?: 'time' | 'linear';
	yAxisLabel: React.ReactNode;
}

export function PercentileBadge({ value }: { value: number }) {
	return (
		<Popover>
			<PopoverTrigger
				nativeButton={false}
				render={
					<Badge
						className="cursor-help transition-colors hover:bg-secondary/80"
						variant="secondary"
					>
						<fbt desc="Label for growth percentile">
							P<fbt:param name="percentile">{Math.round(value)}</fbt:param>
						</fbt>
						<Info className="ml-1 size-3" />
					</Badge>
				}
			/>
			<PopoverContent className="w-80">
				<PopoverHeader>
					<PopoverTitle>
						<fbt desc="Title for percentile explanation popover">
							What is a percentile?
						</fbt>
					</PopoverTitle>
				</PopoverHeader>
				<PopoverDescription className="text-xs leading-normal">
					<fbt desc="Explanation of what a growth percentile means">
						A percentile shows how your child&apos;s measurement compares to
						other children of the same age and sex. For example, P50 means your
						child is in the middle: 50% of children are smaller and 50% are
						larger. P95 means your child is larger than 95% of children the same
						age.
					</fbt>
				</PopoverDescription>
			</PopoverContent>
		</Popover>
	);
}

export default function GrowthMetricCard({
	chartTitle,
	color,
	data,
	datasetLabel,
	emptyStateMessage,
	forecastAge,
	percentile,
	range,
	rangeLabel,
	title,
	unit,
	xAxisLabel,
	xAxisType = 'linear',
	yAxisLabel,
}: GrowthMetricCardProps) {
	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">{title}</CardTitle>
				{percentile !== null && (
					<CardAction>
						<PercentileBadge value={percentile} />
					</CardAction>
				)}
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<LineChart
					backgroundColor={color.backgroundColor}
					borderColor={color.borderColor}
					data={data}
					datasetLabel={datasetLabel}
					emptyStateMessage={emptyStateMessage}
					forecastDate={forecastAge}
					rangeData={range}
					rangeLabel={rangeLabel}
					title={chartTitle}
					xAxisLabel={xAxisLabel}
					xAxisType={xAxisType}
					yAxisLabel={yAxisLabel}
					yAxisUnit={unit}
				/>
			</CardContent>
		</Card>
	);
}
