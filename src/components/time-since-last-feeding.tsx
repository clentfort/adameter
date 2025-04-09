'use client';

import { useState, useEffect } from 'react';
import type { FeedingSession } from '@/types/feeding';
import { useTranslate } from '@/utils/translate';

interface TimeSinceLastFeedingProps {
	lastSession: FeedingSession | null;
}

export default function TimeSinceLastFeeding({
	lastSession,
}: TimeSinceLastFeedingProps) {
	const t = useTranslate();
	const [timeSince, setTimeSince] = useState<string>('');

	useEffect(() => {
		// Update time since last feeding every minute
		const updateTimeSince = () => {
			if (!lastSession) {
				setTimeSince(t('noFeedingYet'));
				return;
			}

			const now = new Date();
			const lastFeedingTime = new Date(lastSession.endTime);
			const diffInMs = now.getTime() - lastFeedingTime.getTime();
			const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
			const diffInHours = Math.floor(diffInMinutes / 60);
			const diffInDays = Math.floor(diffInHours / 24);

			if (diffInMinutes < 1) {
				setTimeSince(t('justNow'));
			} else if (diffInMinutes < 60) {
				setTimeSince(t.formatTimeAgo(diffInMinutes, 'minute'));
			} else if (diffInHours < 24) {
				setTimeSince(t.formatTimeAgo(diffInHours, 'hour'));
			} else {
				setTimeSince(t.formatTimeAgo(diffInDays, 'day'));
			}
		};

		updateTimeSince();
		const intervalId = setInterval(updateTimeSince, 60_000); // Update every minute

		return () => clearInterval(intervalId);
	}, [lastSession, t]);

	return (
		<div className="text-center bg-muted/20 rounded-lg p-2 flex-1">
			<div className="flex items-center justify-center gap-1">
				<span className="text-sm">🍼</span>
				<p className="text-xs text-muted-foreground">
					{t('timeSinceLastFeeding')}
				</p>
			</div>
			<p className="text-sm font-medium">{timeSince}</p>
		</div>
	);
}
