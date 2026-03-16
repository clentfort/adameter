import { cn } from '@/lib/utils';

interface ComparisonValueProps {
	current: number;
	inverse?: boolean; // If true, increase is considered "bad" (e.g. leakage)
	previous: number;
}

export default function ComparisonValue({
	current,
	inverse = false,
	previous,
}: ComparisonValueProps) {
	if (previous === 0) return null;

	const diff = current - previous;
	const percentChange = (diff / previous) * 100;

	// Ignore very small changes
	if (Math.abs(percentChange) < 0.1) return null;

	const isIncrease = diff > 0;

	const finalColorClass = isIncrease
		? inverse
			? 'text-rose-600 dark:text-rose-400'
			: 'text-emerald-600 dark:text-emerald-400'
		: inverse
			? 'text-emerald-600 dark:text-emerald-400'
			: 'text-rose-600 dark:text-rose-400';

	return (
		<span
			className={cn(
				'text-xs font-medium ml-2 inline-flex items-center',
				finalColorClass,
			)}
		>
			{isIncrease ? '↑' : '↓'}
			{Math.abs(Math.round(percentChange))}%
		</span>
	);
}
