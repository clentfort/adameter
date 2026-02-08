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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface YearlyActivityHeatMapProps {
	className?: string;
	dates: string[];
	description: ReactNode;
	palette?: 'diaper' | 'feeding';
	title: ReactNode;
}

const CONTRIBUTION_PALETTES = {
	diaper: {
		levelClasses: [
			'bg-muted border-border/50',
			'bg-amber-100 border-amber-200/70 dark:bg-amber-950 dark:border-amber-900',
			'bg-amber-200 border-amber-300/70 dark:bg-amber-800 dark:border-amber-700',
			'bg-amber-400 border-amber-500/70 dark:bg-amber-700 dark:border-amber-600',
			'bg-amber-600 border-amber-700/70 dark:bg-amber-500 dark:border-amber-400',
		] as const,
		todayRingClass: 'ring-1 ring-amber-700/80 dark:ring-amber-400/80',
	},
	feeding: {
		levelClasses: [
			'bg-muted border-border/50',
			'bg-left-breast/15 border-left-breast/25 dark:bg-left-breast/20 dark:border-left-breast/30',
			'bg-left-breast/30 border-left-breast/35 dark:bg-left-breast/35 dark:border-left-breast/40',
			'bg-left-breast/55 border-left-breast/60 dark:bg-left-breast/55 dark:border-left-breast/60',
			'bg-left-breast border-left-breast-dark dark:bg-left-breast dark:border-left-breast',
		] as const,
		todayRingClass:
			'ring-1 ring-left-breast-dark/80 dark:ring-left-breast-light/80',
	},
} as const;

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
	palette = 'feeding',
	title,
}: YearlyActivityHeatMapProps) {
	const { levelClasses, todayRingClass } = CONTRIBUTION_PALETTES[palette];
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
	const cells = eachDayOfInterval({ end: gridEnd, start: gridStart }).map(
		(day) => {
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
		},
	);

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
							style={{
								gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))`,
							}}
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
											levelClasses[cell.level],
											cell.isToday && todayRingClass,
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
					{levelClasses.map((levelClass, index) => (
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
