import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import type { FeedingSession } from '@/types/feeding';

interface HeatMapProps {
	sessions: FeedingSession[];
}

export default function HeatMap({ sessions = [] }: HeatMapProps) {
	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];

	if (sessionsArray.length === 0) return null;

	// Calculate time distribution (5-minute intervals)
	const distribution = Array(288).fill(0); // 288 5-minute intervals in a day

	sessionsArray.forEach((session) => {
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
			distribution[i % 288]++;
		}

		// If session crosses midnight, continue from the beginning of the day
		if (endInterval > 287) {
			for (let i = 0; i <= endInterval - 288; i++) {
				distribution[i]++;
			}
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
        <Card>
            <CardHeader className="p-4 pb-2">
				<CardTitle className="text-base"><fbt desc="feedingDistribution">Daily Feeding Distribution</fbt></CardTitle>
				<CardDescription><fbt desc="feedingDistributionDescription">Distribution of feeding times throughout the day</fbt></CardDescription>
			</CardHeader>
            <CardContent className="p-4 pt-0">
				<div className="mt-6 mb-2">
					{/* Heat map */}
					<div className="relative h-16 mb-6">
						<div className="absolute top-0 left-0 right-0 h-8 flex">
							{displayIntervals.map((interval, index) => {
								const intensity = maxCount > 0 ? interval.count / maxCount : 0;

								// Vibrant color gradient based on intensity
								let bgColor;
								if (interval.count === 0) {
									bgColor = 'bg-gray-100';
								} else if (intensity < 0.2) {
									bgColor = 'bg-blue-200';
								} else if (intensity < 0.4) {
									bgColor = 'bg-blue-400';
								} else if (intensity < 0.6) {
									bgColor = 'bg-purple-400';
								} else if (intensity < 0.8) {
									bgColor = 'bg-pink-400';
								} else {
									bgColor = 'bg-pink-600';
								}

								return (
									<div
										className={`h-full group relative ${bgColor}`}
										key={index}
										style={{ width: `${100 / displayIntervals.length}%` }}
										title={`${interval.time} Uhr: ${interval.count} Mahlzeit${interval.count !== 1 ? 'en' : ''}`}
									>
										{/* Tooltip */}
										<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
											{interval.time} Uhr: {interval.count}
										</div>
									</div>
								);
							})}
						</div>

						{/* Time markers */}
						<div className="absolute bottom-0 left-0 right-0 flex justify-between">
							{[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => (
								<div className="relative" key={hour}>
									<div
										className="absolute bottom-0 w-px h-2 bg-gray-400"
										style={{ left: `${(hour / 24) * 100}%` }}
									></div>
									<div
										className="absolute bottom-3 transform -translate-x-1/2 text-xs text-muted-foreground"
										style={{ left: `${(hour / 24) * 100}%` }}
									>
										{hour.toString().padStart(2, '0')}:00
									</div>
								</div>
							))}
							<div className="relative">
								<div
									className="absolute bottom-0 w-px h-2 bg-gray-400"
									style={{ right: 0 }}
								></div>
								<div
									className="absolute bottom-3 transform -translate-x-1/2 text-xs text-muted-foreground"
									style={{ right: '-8px' }}
								>
									24:00
								</div>
							</div>
						</div>
					</div>

					{/* Legend */}
					<div className="flex justify-center items-center gap-4 text-xs text-muted-foreground mt-4">
						<div className="flex items-center gap-1">
							<div className="w-3 h-3 bg-pink-600"></div>
							<span><fbt desc="veryHighActivity">Very High Activity</fbt></span>
						</div>
						<div className="flex items-center gap-1">
							<div className="w-3 h-3 bg-pink-400"></div>
							<span><fbt desc="highActivity">High Activity</fbt></span>
						</div>
						<div className="flex items-center gap-1">
							<div className="w-3 h-3 bg-purple-400"></div>
							<span><fbt desc="mediumActivity">Medium Activity</fbt></span>
						</div>
						<div className="flex items-center gap-1">
							<div className="w-3 h-3 bg-blue-400"></div>
							<span><fbt desc="lowActivity">Low Activity</fbt></span>
						</div>
						<div className="flex items-center gap-1">
							<div className="w-3 h-3 bg-blue-200"></div>
							<span><fbt desc="veryLowActivity">Very Low Activity</fbt></span>
						</div>
					</div>
				</div>
			</CardContent>
        </Card>
    );
}
