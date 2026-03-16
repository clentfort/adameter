import type { FeedingSession } from '@/types/feeding';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

interface HeatMapProps {
	className?: string;
	sessions: FeedingSession[];
}

const INTENSITY_CLASSES = [
	'bg-muted/60 dark:bg-zinc-800',
	'bg-left-breast/20 dark:bg-left-breast/35',
	'bg-left-breast/45 dark:bg-left-breast/55',
	'bg-right-breast/45 dark:bg-right-breast/55',
	'bg-right-breast/65 dark:bg-right-breast/70',
	'bg-right-breast dark:bg-right-breast-light',
] as const;

function calculateHeatMapDistribution(sessions: FeedingSession[]) {
	const dist = Array(288).fill(0); // 288 5-minute intervals in a day
	sessions.forEach((session) => {
		const startTime = new Date(session.startTime);
		const endTime = new Date(session.endTime);

		// Calculate which 5-minute intervals this session spans
		const startMinuteOfDay = startTime.getHours() * 60 + startTime.getMinutes();
		const endMinuteOfDay = endTime.getHours() * 60 + endTime.getMinutes();

		// Handle sessions that span midnight
		const startInterval = Math.floor(startMinuteOfDay / 5);
		let endInterval = Math.floor(endMinuteOfDay / 5);

		if (endInterval < startInterval) {
			// Session crosses midnight
			endInterval += 288;
		}

		// Mark all intervals that this session spans
		for (let i = startInterval; i <= Math.min(endInterval, 287); i++) {
			dist[i % 288]++;
		}

		// If session crosses midnight, continue from the beginning of the day
		if (endInterval > 287) {
			for (let i = 0; i <= endInterval - 288; i++) {
				dist[i]++;
			}
		}
	});

	return dist;
}

function calculateDisplayIntervals(distribution: number[]) {
	return distribution.map((count, i) => {
		const hour = Math.floor((i * 5) / 60);
		const minute = (i * 5) % 60;
		const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

		return {
			count,
			index: i,
			time: timeLabel,
		};
	});
}

export default function HeatMap({ className, sessions = [] }: HeatMapProps) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(
		null,
	);
	const containerRef = useRef<HTMLDivElement>(null);

	// Calculate time distribution (5-minute intervals)
	const distribution = useMemo(
		() => calculateHeatMapDistribution(sessions),
		[sessions],
	);

	// Find the maximum count for scaling
	const maxCount = useMemo(() => Math.max(...distribution), [distribution]);

	// Create display intervals
	const displayIntervals = useMemo(
		() => calculateDisplayIntervals(distribution),
		[distribution],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!containerRef.current) return;

			const rect = containerRef.current.getBoundingClientRect();
			const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
			const y = e.clientY - rect.top;

			const percentage = x / rect.width;
			const index = Math.floor(percentage * displayIntervals.length);

			setActiveIndex(Math.min(index, displayIntervals.length - 1));
			setPointerPos({ x, y });
		},
		[displayIntervals.length],
	);

	const handlePointerLeave = useCallback(() => {
		setActiveIndex(null);
		setPointerPos(null);
	}, []);

	if (sessions.length === 0 || maxCount === 0) return null;

	const activeInterval =
		activeIndex !== null ? displayIntervals[activeIndex] : null;

	return (
		<Card className={className}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the feeding distribution heat map">
						Daily Feeding Distribution
					</fbt>
				</CardTitle>
				<CardDescription>
					<fbt desc="Description for the feeding distribution heat map">
						Distribution of feeding times throughout the day
					</fbt>
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="mt-6 mb-2 rounded-lg border border-border/70 bg-muted/20 p-3 dark:border-zinc-700/80 dark:bg-zinc-900/60">
					<div className="relative h-16 mb-6">
						<div
							className="absolute top-0 left-0 right-0 h-8 flex overflow-hidden rounded-md cursor-crosshair touch-none"
							onPointerDown={handlePointerMove}
							onPointerLeave={handlePointerLeave}
							onPointerMove={handlePointerMove}
							ref={containerRef}
						>
							{displayIntervals.map((interval, index) => {
								const intensity = maxCount > 0 ? interval.count / maxCount : 0;
								const level =
									interval.count === 0
										? 0
										: intensity < 0.2
											? 1
											: intensity < 0.4
												? 2
												: intensity < 0.6
													? 3
													: intensity < 0.8
														? 4
														: 5;

								const timeString = `${interval.time} Uhr: ${interval.count} Mahlzeit${interval.count !== 1 ? 'en' : ''}`;
								return (
									<div
										aria-label={timeString}
										className={`h-full border-y border-r border-black/5 first:border-l dark:border-white/10 transition-colors ${INTENSITY_CLASSES[level]} ${activeIndex === index ? 'ring-2 ring-inset ring-white/50 z-10' : ''}`}
										key={index}
										role="img"
										style={{ width: `${100 / displayIntervals.length}%` }}
										title={timeString}
									/>
								);
							})}
						</div>

						{/* Magnifying Lens / Tooltip */}
						{activeInterval && pointerPos && containerRef.current && (
							<div
								className="absolute z-20 pointer-events-none transition-transform duration-75 ease-out"
								style={{
									left: Math.max(
										48,
										Math.min(
											pointerPos.x,
											containerRef.current.offsetWidth - 48,
										),
									),
									top: -8,
									transform: 'translate(-50%, -100%)',
								}}
							>
								<div className="flex flex-col items-center">
									<div className="bg-foreground text-background rounded-full px-3 py-1.5 shadow-2xl flex flex-col items-center min-w-24 border border-background/20 animate-in fade-in zoom-in-95 duration-100 ring-4 ring-black/5 dark:ring-white/5">
										<span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
											{activeInterval.time} Uhr
										</span>
										<span className="text-sm font-black">
											{activeInterval.count} Mahlzeit
											{activeInterval.count !== 1 ? 'en' : ''}
										</span>
									</div>
									<div
										className="w-2 h-2 bg-foreground rotate-45 -mt-1 shadow-lg"
										style={{
											marginLeft: `${(pointerPos.x - Math.max(48, Math.min(pointerPos.x, containerRef.current.offsetWidth - 48))) * 2}px`,
										}}
									/>
								</div>
							</div>
						)}

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

					<div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-[2px] border border-black/5 bg-right-breast dark:border-white/10 dark:bg-right-breast-light"></div>
							<span>
								<fbt desc="Heat map legend label for very high activity">
									Very High Activity
								</fbt>
							</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-[2px] border border-black/5 bg-right-breast/65 dark:border-white/10 dark:bg-right-breast/70"></div>
							<span>
								<fbt desc="Heat map legend label for high activity">
									High Activity
								</fbt>
							</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-[2px] border border-black/5 bg-right-breast/45 dark:border-white/10 dark:bg-right-breast/55"></div>
							<span>
								<fbt desc="Heat map legend label for medium activity">
									Medium Activity
								</fbt>
							</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-[2px] border border-black/5 bg-left-breast/45 dark:border-white/10 dark:bg-left-breast/55"></div>
							<span>
								<fbt desc="Heat map legend label for low activity">
									Low Activity
								</fbt>
							</span>
						</div>
						<div className="flex items-center gap-1">
							<div className="h-3 w-3 rounded-[2px] border border-black/5 bg-left-breast/20 dark:border-white/10 dark:bg-left-breast/35"></div>
							<span>
								<fbt desc="Heat map legend label for very low activity">
									Very Low Activity
								</fbt>
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
