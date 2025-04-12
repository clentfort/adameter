'use client';

import type { FeedingSession } from '@/types/feeding';
import { fbt } from 'fbtee';
import { useEffect, useState } from 'react';

interface TimeSinceLastFeedingProps {
	lastSession: FeedingSession | null;
}

export default function TimeSinceLastFeeding({
	lastSession,
}: TimeSinceLastFeedingProps) {
	const [timeSince, setTimeSince] = useState<string>('');

	useEffect(() => {
		// Update time since last feeding every minute
		const updateTimeSince = () => {
			if (!lastSession) {
				setTimeSince(
					fbt(
						'No feeding recorded yet',
						'Label indicating no feeding was recorded yet',
					),
				);

				return;
			}

			const now = new Date();
			const lastFeedingTime = new Date(lastSession.endTime);
			const diffInMs = now.getTime() - lastFeedingTime.getTime();
			const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
			const diffInHours = Math.floor(diffInMinutes / 60);
			const diffInDays = Math.floor(diffInHours / 24);

			if (diffInMinutes < 1) {
				setTimeSince(
					fbt(
						'Just now',
						'Label indicating the last diaper change was just now',
					),
				);
			} else if (diffInMinutes < 60) {
				setTimeSince(
					fbt(
						[fbt.plural('minute', diffInMinutes, { many: 'minutes' }), 'ago'],
						'Label indicating that something was a few minutes ago',
					),
				);
			} else if (diffInHours < 24) {
				setTimeSince(
					fbt(
						[fbt.plural('hour', diffInHours, { many: 'hours' }), 'ago'],
						'Label indicating that something was a few hours ago',
					),
				);
			} else {
				setTimeSince(
					fbt(
						[fbt.plural('day', diffInDays, { many: 'days' }), 'ago'],
						'Label indicating that something was a few days ago',
					),
				);
			}
		};

		updateTimeSince();
		const intervalId = setInterval(updateTimeSince, 60_000); // Update every minute

		return () => clearInterval(intervalId);
	}, [lastSession]);

	return (
		<div className="text-center bg-muted/20 rounded-lg p-2 flex-1">
			<div className="flex items-center justify-center gap-1">
				<span className="text-sm">🍼</span>
				<p className="text-xs text-muted-foreground">
					<fbt desc="Short label indicating when a feeding was last recorded">
						Last Feeding
					</fbt>
				</p>
			</div>
			<p className="text-sm font-medium">{timeSince}</p>
		</div>
	);
}
