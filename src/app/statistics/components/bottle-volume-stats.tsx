import type { FeedingSession } from '@/types/feeding';
import { useFormulaProductsSnapshot } from '@/hooks/use-formula-products';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface BottleVolumeStatsProps {
	comparisonSessions?: FeedingSession[];
	sessions: FeedingSession[];
}

export default function BottleVolumeStats({
	comparisonSessions,
	sessions = [],
}: BottleVolumeStatsProps) {
	const formulaProducts = useFormulaProductsSnapshot();

	const bottleSessions = sessions.filter(s => s.type === 'bottle');
	const totalVolume = bottleSessions.reduce((sum, s) => sum + (s.amountMl || 0), 0);

	const prevBottleSessions = comparisonSessions?.filter(s => s.type === 'bottle') || [];
	const prevTotalVolume = prevBottleSessions.reduce((sum, s) => sum + (s.amountMl || 0), 0);

	const estimatedCost = bottleSessions.reduce((sum, s) => {
		if (s.milkType === 'formula' && s.formulaProductId) {
			const product = formulaProducts.find(p => p.id === s.formulaProductId);
			if (product?.costPerMl) {
				return sum + (s.amountMl || 0) * product.costPerMl;
			}
		}
		return sum;
	}, 0);

	const prevEstimatedCost = prevBottleSessions.reduce((sum, s) => {
		if (s.milkType === 'formula' && s.formulaProductId) {
			const product = formulaProducts.find(p => p.id === s.formulaProductId);
			if (product?.costPerMl) {
				return sum + (s.amountMl || 0) * product.costPerMl;
			}
		}
		return sum;
	}, 0);

	if (totalVolume === 0 && prevTotalVolume === 0) return null;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the total bottle volume statistics card">
					Total Bottle Volume
				</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">{totalVolume}ml</div>
				{comparisonSessions !== undefined && (
					<ComparisonValue
						current={totalVolume}
						previous={prevTotalVolume}
					/>
				)}
			</div>
			{estimatedCost > 0 && (
				<div className="text-xs text-muted-foreground mt-1">
					<fbt desc="Estimated formula cost label">
						Est. Cost: <fbt:param name="cost">{estimatedCost.toFixed(2)}</fbt:param>
					</fbt>
					{comparisonSessions !== undefined && (
						<ComparisonValue current={estimatedCost} previous={prevEstimatedCost} />
					)}
				</div>
			)}
		</StatsCard>
	);
}
