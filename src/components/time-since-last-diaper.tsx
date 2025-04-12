'use client';

import type { DiaperChange } from '@/types/diaper';
import { fbt } from 'fbtee';
import { useEffect, useState } from 'react';

interface TimeSinceLastDiaperProps {
	lastChange: DiaperChange | null;
}

export default function TimeSinceLastDiaper({
	lastChange,
}: TimeSinceLastDiaperProps) {
	const [timeSince, setTimeSince] = useState<string>('');

	useEffect(() => {
		// Update time since last diaper change every minute
		const updateTimeSince = () => {
			if (!lastChange) {
				setTimeSince(
					fbt(
						'No diaper change recorded yet',
						'Label indicating no diaper change was recorded yet',
					),
				);

				return;
			}

			const now = new Date();
			const lastChangeTime = new Date(lastChange.timestamp);
			const diffInMs = now.getTime() - lastChangeTime.getTime();
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
	}, [lastChange]);

	return (
		<div className="text-center bg-muted/20 rounded-lg p-2 flex-1">
			<div className="flex items-center justify-center gap-1">
				<span className="text-sm">👶</span>
				<p className="text-xs text-muted-foreground">
					<fbt desc="A short label indicating when a diaper was last changed">
						Last Diaper Change
					</fbt>
				</p>
			</div>
			<p className="text-sm font-medium">{timeSince}</p>
		</div>
	);
}
