'use client';

import { formatDistanceToNow } from 'date-fns';
import { fbt } from 'fbtee';
import { ReactNode, useEffect, useState } from 'react';

interface TimeSinceLastDiaperProps {
	children: ReactNode;
	icon: ReactNode;
	lastChange: string | null;
}

export default function TimeSince({
	children,
	icon,
	lastChange,
}: TimeSinceLastDiaperProps) {
	const [timeSince, setTimeSince] = useState<string>('');

	useEffect(() => {
		// Update time since last diaper change every minute
		const updateTimeSince = () => {
			if (!lastChange) {
				setTimeSince(
					fbt(
						'No data yet',
						'Placeholder value indicating that no data has been recorded',
					),
				);

				return;
			}

			const lastChangeTime = new Date(lastChange);
			setTimeSince(formatDistanceToNow(lastChangeTime));
		};

		updateTimeSince();
		const intervalId = setInterval(updateTimeSince, 60_000); // Update every minute

		return () => clearInterval(intervalId);
	}, [lastChange]);

	return (
		<div className="text-center bg-muted/20 rounded-lg p-2 flex-1">
			<div className="flex items-center justify-center gap-1">
				<span className="text-sm">{icon}</span>
				<p className="text-xs text-muted-foreground">{children}</p>
			</div>
			<p className="text-sm font-medium">{timeSince}</p>
		</div>
	);
}
