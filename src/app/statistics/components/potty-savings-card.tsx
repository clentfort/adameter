import type { DiaperChange } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/i18n-context';
import { useCurrency } from '@/hooks/use-currency';
import StatsCard from './stats-card';

interface PottySavingsCardProps {
	diaperChanges: DiaperChange[];
	disposableChanges: Array<{ cost: number; timestamp: Date }>;
}

function getDisposableAverageAround(
	timestamp: Date,
	disposableChanges: Array<{ cost: number; timestamp: Date }>,
): number | null {
	const costs = disposableChanges
		.filter(
			(disposableChange) =>
				Math.abs(differenceInDays(disposableChange.timestamp, timestamp)) <= 7,
		)
		.map((disposableChange) => disposableChange.cost);

	if (costs.length === 0) {
		return null;
	}

	return costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
}

export default function PottySavingsCard({
	diaperChanges,
	disposableChanges,
}: PottySavingsCardProps) {
	const [currency] = useCurrency();
	const { locale } = useLanguage();

	const savings = useMemo(
		() =>
			diaperChanges
				.filter(
					(change) =>
						(change.pottyUrine && !change.containsUrine) ||
						(change.pottyStool && !change.containsStool),
				)
				.reduce((total, change) => {
					const avg = getDisposableAverageAround(
						new Date(change.timestamp),
						disposableChanges,
					);
					return total + (avg || 0);
				}, 0),
		[diaperChanges, disposableChanges],
	);
	if (savings === 0) return null;
	const formattedSavings = new Intl.NumberFormat(locale.replace('_', '-'), {
		currency,
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: 'currency',
	}).format(savings);
	return (
		<StatsCard
			title={<fbt desc="Title for the potty savings card">Potty Savings</fbt>}
		>
			<div className="text-2xl font-bold text-green-700 dark:text-green-400">
				{formattedSavings}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Description of how potty savings are calculated">
					Estimated savings from successful potty hits.
				</fbt>
			</div>
		</StatsCard>
	);
}
