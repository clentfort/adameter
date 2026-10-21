'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/i18n-context';
import { useCurrency } from '@/hooks/use-currency';
import { formatCurrency } from '@/utils/format-currency';
import { getDaySpan } from '../utils/day-span';
import ComparisonValue from './comparison-value';
import StatsCard, { StatBreakdownRow, StatHeadline } from './stats-card';

interface DiaperCostStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
	products: DiaperProduct[];
}

function calculateCostMetrics(
	changes: DiaperChange[],
	productCostById: Map<string, number>,
) {
	let totalCost = 0;
	for (const change of changes) {
		if (change.diaperProductId) {
			totalCost += productCostById.get(change.diaperProductId) || 0;
		}
	}

	let avgPerDay = 0;
	if (changes.length > 0) {
		const days = getDaySpan(changes.map((c) => c.timestamp));
		avgPerDay = totalCost / days;
	}

	return { avgPerDay, totalCost };
}

export default function DiaperCostStats({
	comparisonDiaperChanges,
	diaperChanges = [],
	products = [],
}: DiaperCostStatsProps) {
	const [currency] = useCurrency();
	const { locale } = useLanguage();

	const productCostById = useMemo(
		() => new Map(products.map((p) => [p.id, p.costPerDiaper || 0])),
		[products],
	);

	const metrics = useMemo(
		() => calculateCostMetrics(diaperChanges, productCostById),
		[diaperChanges, productCostById],
	);

	const prevMetrics = useMemo(
		() =>
			comparisonDiaperChanges
				? calculateCostMetrics(comparisonDiaperChanges, productCostById)
				: null,
		[comparisonDiaperChanges, productCostById],
	);

	return (
		<StatsCard
			title={
				<fbt desc="Title for diaper cost statistics card">Diaper Costs</fbt>
			}
		>
			<StatHeadline
				comparison={
					prevMetrics && (
						<ComparisonValue
							current={metrics.totalCost}
							inverse
							previous={prevMetrics.totalCost}
						/>
					)
				}
				value={formatCurrency(metrics.totalCost, currency, locale)}
			/>
			<StatBreakdownRow
				className="mt-1"
				label={
					<fbt desc="Label for average diaper cost per day">Avg per day</fbt>
				}
				value={
					<>
						<span className="font-medium text-foreground">
							{formatCurrency(metrics.avgPerDay, currency, locale)}
						</span>
						{prevMetrics && (
							<ComparisonValue
								current={metrics.avgPerDay}
								inverse
								previous={prevMetrics.avgPerDay}
							/>
						)}
					</>
				}
			/>
		</StatsCard>
	);
}
