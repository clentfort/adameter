import type { ReactNode } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

interface HeatMapProps {
	className?: string;
	data: { endTime?: string; startTime: string }[];
	description: ReactNode;
	palette?: 'diaper' | 'feeding';
	title: ReactNode;
}

const PALETTES = {
	diaper: [
		'bg-muted/60 dark:bg-zinc-800',
		'bg-amber-100/40 border-amber-200/20',
		'bg-amber-100 border-amber-200/50',
		'bg-amber-200 border-amber-300/50',
		'bg-amber-300 border-amber-400/50',
		'bg-amber-400 border-amber-500/50',
		'bg-amber-500 border-amber-600/50',
		'bg-amber-600 border-amber-700/50',
		'bg-amber-700 border-amber-800/50',
		'bg-amber-800 border-amber-900/50',
	],
	feeding: [
		'bg-muted/60 dark:bg-zinc-800',
		'bg-left-breast/10',
		'bg-left-breast/25',
		'bg-left-breast/40',
		'bg-left-breast/55',
		'bg-right-breast/30',
		'bg-right-breast/45',
		'bg-right-breast/60',
		'bg-right-breast/75',
		'bg-right-breast',
	],
} as const;

export default function HeatMap({
	className,
	data = [],
	description,
	palette = 'feeding',
	title,
}: HeatMapProps) {
	if (data.length === 0) return null;

	const intensityClasses = PALETTES[palette];

	// Calculate time distribution (5-minute intervals)
	const distribution = Array(288).fill(0); // 288 5-minute intervals in a day

	data.forEach((item) => {
		const startTime = new Date(item.startTime);
		const startMinuteOfDay = startTime.getHours() * 60 + startTime.getMinutes();
		const startInterval = Math.floor(startMinuteOfDay / 5);

		if (item.endTime) {
			const endTime = new Date(item.endTime);
			const endMinuteOfDay = endTime.getHours() * 60 + endTime.getMinutes();
			let endInterval = Math.floor(endMinuteOfDay / 5);

			if (endInterval < startInterval) {
				// Session crosses midnight
				endInterval += 288;
			}

			// Mark all intervals that this session spans
			for (let i = startInterval; i <= Math.min(endInterval, 287); i++) {
				distribution[i % 288]++;
			}

			// If session crosses midnight, continue from the beginning of the day
			if (endInterval > 287) {
				for (let i = 0; i <= endInterval - 288; i++) {
					distribution[i]++;
				}
			}
		} else {
			// Single point in time
			distribution[startInterval]++;
		}
	});

	// Find the maximum count for scaling
	const maxCount = Math.max(...distribution);

	if (maxCount === 0) return null;

	// Create display intervals
	const displayIntervals = distribution.map((count, i) => {
		const hour = Math.floor((i * 5) / 60);
		const minute = (i * 5) % 60;
		const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

		return {
			count,
			index: i,
			time: timeLabel,
		};
	});

	return (
		<Card className={className}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="mt-6 mb-2 rounded-lg border border-border/70 bg-muted/20 p-3 dark:border-zinc-700/80 dark:bg-zinc-900/60">
					<div className="relative h-16 mb-6">
						<div className="absolute top-0 left-0 right-0 h-8 flex overflow-hidden rounded-md">
							{displayIntervals.map((interval, index) => {
								const intensity = maxCount > 0 ? interval.count / maxCount : 0;
								const level =
									interval.count === 0
										? 0
										: Math.min(9, Math.ceil(intensity * 9));

								return (
									<div
										className={`h-full border-y border-r border-black/5 first:border-l dark:border-white/10 group relative transition-colors ${intensityClasses[level]}`}
										key={index}
										style={{ width: `${100 / displayIntervals.length}%` }}
									>
										<div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 transform whitespace-nowrap rounded bg-foreground px-2 py-1 text-[10px] text-background opacity-0 transition-opacity pointer-events-none group-hover:opacity-100">
											{interval.time}: {interval.count}
										</div>
									</div>
								);
							})}
						</div>

						<div className="absolute bottom-0 left-0 right-0">
							{[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
								<div
									className="absolute bottom-0"
									key={hour}
									style={{ left: `${(hour / 24) * 100}%` }}
								>
									<div className="h-2 w-px -translate-x-1/2 transform bg-zinc-400 dark:bg-zinc-500"></div>
									<div
										className={`absolute bottom-3 -translate-x-1/2 transform text-[10px] text-muted-foreground ${hour % 6 === 0 ? '' : 'hidden sm:block'}`}
									>
										{hour.toString().padStart(2, '0')}:00
									</div>
								</div>
							))}
							<div className="absolute bottom-0 right-0">
								<div className="h-2 w-px bg-zinc-400 dark:bg-zinc-500"></div>
								<div className="absolute bottom-3 right-0 translate-x-1/2 transform text-[10px] text-muted-foreground">
									24:00
								</div>
							</div>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
						<span>
							<fbt desc="Legend minimum activity label">Less</fbt>
						</span>
						{intensityClasses.map((levelClass, index) => (
							<div
								className={`h-3 w-3 rounded-[2px] border border-black/5 dark:border-white/10 ${levelClass}`}
								key={index}
							/>
						))}
						<span>
							<fbt desc="Legend maximum activity label">More</fbt>
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
