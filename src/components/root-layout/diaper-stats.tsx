import { useTodayDiaperStats } from '@/hooks/use-today-diaper-stats';

export default function DiaperStats() {
	const { stoolCount, urineCount } = useTodayDiaperStats();

	return (
		<div className="text-center bg-muted/20 rounded-lg p-2 flex-1 flex flex-col justify-center">
			<div className="flex items-center justify-center gap-1">
				<span className="text-sm">👶</span>
				<p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
					<fbt desc="Label for today's diaper stats">Diapers Today</fbt>
				</p>
			</div>
			<div className="flex items-baseline justify-center gap-1">
				<span className="text-sm font-medium tabular-nums">{urineCount}</span>
				<span className="text-xs mr-2">💧</span>
				<span className="text-sm font-medium tabular-nums">{stoolCount}</span>
				<span className="text-xs">💩</span>
			</div>
		</div>
	);
}
