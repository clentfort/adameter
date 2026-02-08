import type { ReactNode } from 'react';
import {
	differenceInCalendarWeeks,
	eachDayOfInterval,
	endOfWeek,
	endOfYear,
	format,
	startOfWeek,
	startOfYear,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

interface YearlyActivityHeatMapProps {
	className?: string;
	dates: string[];
	description: ReactNode;
	title: ReactNode;
}

const CONTRIBUTION_LEVEL_CLASSES = [
	'bg-muted border-border/50',
	'bg-emerald-100 border-emerald-200/70 dark:bg-emerald-950 dark:border-emerald-900',
	'bg-emerald-200 border-emerald-300/70 dark:bg-emerald-800 dark:border-emerald-700',
	'bg-emerald-400 border-emerald-500/70 dark:bg-emerald-700 dark:border-emerald-600',
	'bg-emerald-600 border-emerald-700/70 dark:bg-emerald-500 dark:border-emerald-400',
] as const;

function getContributionLevel(count: number, maxCount: number) {
	if (count === 0 || maxCount === 0) {
		return 0;
	}

	const ratio = count / maxCount;

	if (ratio <= 0.25) {
		return 1;
	}

	if (ratio <= 0.5) {
		return 2;
	}

	if (ratio <= 0.75) {
		return 3;
	}

	return 4;
}

export default function YearlyActivityHeatMap({
	className,
	dates,
	description,
	title,
}: YearlyActivityHeatMapProps) {
	const now = new Date();
	const currentYear = now.getFullYear();
	const yearStart = startOfYear(new Date(currentYear, 0, 1));
	const yearEnd = endOfYear(new Date(currentYear, 0, 1));
	const gridStart = startOfWeek(yearStart, { weekStartsOn: 0 });
	const gridEnd = endOfWeek(yearEnd, { weekStartsOn: 0 });

	const countsByDate = dates
		.map((value) => new Date(value))
		.filter(
			(date) =>
				!Number.isNaN(date.getTime()) && date.getFullYear() === currentYear,
		)
		.reduce<Map<string, number>>((accumulator, date) => {
			const key = format(date, 'yyyy-MM-dd');
			const current = accumulator.get(key) ?? 0;
			accumulator.set(key, current + 1);
			return accumulator;
		}, new Map());

	const maxCount = Math.max(0, ...countsByDate.values());
	const weekCount =
		differenceInCalendarWeeks(gridEnd, gridStart, { weekStartsOn: 0 }) + 1;

	const monthLabels = Array.from({ length: 12 }, (_, monthIndex) => {
		const monthStart = new Date(currentYear, monthIndex, 1);
		const weekIndex = differenceInCalendarWeeks(monthStart, gridStart, {
			weekStartsOn: 0,
		});

		return {
			label: format(monthStart, 'MMM'),
			monthIndex,
			weekIndex,
		};
	});

	const todayKey = format(now, 'yyyy-MM-dd');
	const cells = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => {
		const key = format(day, 'yyyy-MM-dd');
		const inCurrentYear = day.getFullYear() === currentYear;
		const count = inCurrentYear ? (countsByDate.get(key) ?? 0) : 0;

		return {
			count,
			inCurrentYear,
			isToday: key === todayKey,
			key,
			level: getContributionLevel(count, maxCount),
			title: `${format(day, 'PPP')}: ${count}`,
		};
	});

	return (
		<Card className={className}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="overflow-x-auto pb-2">
					<div className="inline-block min-w-full">
						<div
							className="mb-1 grid gap-1 text-[11px] text-muted-foreground"
							style={{ gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))` }}
						>
							{monthLabels.map(({ label, monthIndex, weekIndex }) => (
								<span
									className="leading-none"
									key={monthIndex}
									style={{ gridColumnStart: weekIndex + 1 }}
								>
									{label}
								</span>
							))}
						</div>

						<div className="grid grid-flow-col grid-rows-7 gap-1">
							{cells.map((cell) => {
								if (!cell.inCurrentYear) {
									return (
										<div
											className="h-3 w-3 rounded-[3px] border border-transparent bg-transparent"
											key={cell.key}
										/>
									);
								}

								return (
									<div
										className={cn(
											'h-3 w-3 rounded-[3px] border transition-colors',
											CONTRIBUTION_LEVEL_CLASSES[cell.level],
											cell.isToday && 'ring-1 ring-emerald-700/80 dark:ring-emerald-400/80',
										)}
										data-testid={`yearly-cell-${cell.key}`}
										key={cell.key}
										title={cell.title}
									/>
								);
							})}
						</div>
					</div>
				</div>

				<div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
					<span>
						<fbt desc="Legend minimum activity label">Less</fbt>
					</span>
					{CONTRIBUTION_LEVEL_CLASSES.map((levelClass, index) => (
						<div
							className={cn('h-3 w-3 rounded-[3px] border', levelClass)}
							key={index}
						/>
					))}
					<span>
						<fbt desc="Legend maximum activity label">More</fbt>
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
