import type { ReactNode } from 'react';
import {
	differenceInCalendarWeeks,
	eachDayOfInterval,
	eachMonthOfInterval,
	endOfDay,
	endOfWeek,
	format,
	isWithinInterval,
	startOfDay,
	startOfWeek,
	subYears,
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
			'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30',
			'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60',
			'bg-amber-200 dark:bg-amber-900 border-amber-300 dark:border-amber-800',
			'bg-amber-300 dark:bg-amber-800 border-amber-400 dark:border-amber-700',
			'bg-amber-400 dark:bg-amber-700 border-amber-500 dark:border-amber-600',
			'bg-amber-500 dark:bg-amber-600 border-amber-600 dark:border-amber-500',
			'bg-amber-600 dark:bg-amber-500 border-amber-700 dark:border-amber-400',
			'bg-amber-700 dark:bg-amber-400 border-amber-800 dark:border-amber-300',
			'bg-amber-800 dark:bg-amber-300 border-amber-900 dark:border-amber-200',
		] as const,
		todayRingClass: 'ring-1 ring-amber-700/80 dark:ring-amber-400/80',
	},
	feeding: {
		levelClasses: [
			'bg-muted border-border/50',
			'bg-left-breast/10 border-left-breast/20',
			'bg-left-breast/20 border-left-breast/30',
			'bg-left-breast/30 border-left-breast/40',
			'bg-left-breast/40 border-left-breast/50',
			'bg-left-breast/50 border-left-breast/60',
			'bg-left-breast/65 border-left-breast/75',
			'bg-left-breast/80 border-left-breast/90',
			'bg-left-breast/90 border-left-breast-dark',
			'bg-left-breast border-left-breast-dark',
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
	// Return a level between 1 and 9
	return Math.min(9, Math.ceil(ratio * 9));
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
	const startDate = subYears(startOfDay(now), 1);
	const gridStart = startOfWeek(startDate, { weekStartsOn: 0 });
	const gridEnd = endOfWeek(now, { weekStartsOn: 0 });

	const countsByDate = dates
		.map((value) => new Date(value))
		.filter((date) => {
			if (Number.isNaN(date.getTime())) return false;
			return isWithinInterval(date, {
				end: endOfDay(now),
				start: startDate,
			});
		})
		.reduce<Map<string, number>>((accumulator, date) => {
			const key = format(date, 'yyyy-MM-dd');
			const current = accumulator.get(key) ?? 0;
			accumulator.set(key, current + 1);
			return accumulator;
		}, new Map());

	const maxCount = Math.max(0, ...countsByDate.values());
	const weekCount =
		differenceInCalendarWeeks(gridEnd, gridStart, { weekStartsOn: 0 }) + 1;

	const monthLabels = eachMonthOfInterval({
		end: gridEnd,
		start: gridStart,
	}).map((monthStart, index) => {
		const weekIndex = differenceInCalendarWeeks(monthStart, gridStart, {
			weekStartsOn: 0,
		});

		return {
			label: format(monthStart, 'MMM'),
			monthIndex: index,
			weekIndex: Math.max(0, weekIndex),
		};
	});

	const todayKey = format(now, 'yyyy-MM-dd');
	const cells = eachDayOfInterval({ end: gridEnd, start: gridStart }).map(
		(day) => {
			const key = format(day, 'yyyy-MM-dd');
			const count = countsByDate.get(key) ?? 0;

			return {
				count,
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
							{cells.map((cell) => (
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
							))}
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
