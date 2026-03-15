import { StatsSectionSkeleton } from './components/stats-skeleton';

export default function StatisticsLoading() {
	return (
		<div className="w-full space-y-8">
			<div className="h-16 w-full border-b mb-6" />
			<StatsSectionSkeleton title="Feeding" />
			<StatsSectionSkeleton title="Diaper" />
		</div>
	);
}
