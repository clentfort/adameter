'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/i18n-context';
import { Currency, useCurrency } from '@/hooks/use-currency';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface DiaperCostStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
	products: DiaperProduct[];
}

function formatCurrency(value: number, currency: Currency, locale: string) {
	return new Intl.NumberFormat(locale.replace('_', '-'), {
		currency,
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: 'currency',
	}).format(value);
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
		const oldest = new Date(
			Math.min(...changes.map((c) => new Date(c.timestamp).getTime())),
		);
		const newest = new Date(
			Math.max(...changes.map((c) => new Date(c.timestamp).getTime())),
		);
		const days = Math.max(1, differenceInDays(newest, oldest) + 1);
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
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">
					{formatCurrency(metrics.totalCost, currency, locale)}
				</div>
				{prevMetrics && (
					<ComparisonValue
						current={metrics.totalCost}
						inverse
						previous={prevMetrics.totalCost}
					/>
				)}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Label for average diaper cost per day">Avg per day</fbt>:{' '}
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
			</div>
		</StatsCard>
	);
}
