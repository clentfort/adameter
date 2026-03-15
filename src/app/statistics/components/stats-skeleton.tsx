import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
	return (
		<Card size="sm">
			<CardHeader className="gap-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-3 w-32" />
			</CardHeader>
			<CardContent>
				<Skeleton className="h-8 w-16 mb-2" />
				<Skeleton className="h-3 w-20" />
			</CardContent>
		</Card>
	);
}

export function ChartSkeleton({ height = 'h-[200px]' }: { height?: string }) {
	return (
		<Card className="w-full">
			<CardHeader>
				<Skeleton className="h-5 w-32 mb-1" />
				<Skeleton className="h-4 w-48" />
			</CardHeader>
			<CardContent className="pb-6">
				<Skeleton className={height} />
			</CardContent>
		</Card>
	);
}

export function StatsSectionSkeleton({
	title,
	withCharts = true,
}: {
	title: React.ReactNode;
	withCharts?: boolean;
}) {
	return (
		<div className="space-y-4">
			<h3 className="text-lg font-medium mt-6 mb-4">{title}</h3>
			<div className="grid grid-cols-2 gap-4">
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
				<CardSkeleton />
			</div>
			{withCharts && (
				<div className="space-y-4 mt-4">
					<ChartSkeleton />
					<ChartSkeleton />
				</div>
			)}
		</div>
	);
}
