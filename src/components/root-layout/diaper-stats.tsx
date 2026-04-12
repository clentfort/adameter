import { useTodayDiaperStats } from '@/hooks/use-today-diaper-stats';
import HeaderIndicator from './header-indicator';

export default function DiaperStats() {
	const { stoolCount, urineCount } = useTodayDiaperStats();

	return (
		<HeaderIndicator
			icon="👶"
			label={<fbt desc="Label for today's diaper stats">Diapers Today</fbt>}
		>
			<div className="flex items-baseline justify-center gap-1">
				<span className="tabular-nums">{urineCount}</span>
				<span className="text-xs mr-2">💧</span>
				<span className="tabular-nums">{stoolCount}</span>
				<span className="text-xs">💩</span>
			</div>
		</HeaderIndicator>
	);
}
