import { differenceInMinutes } from 'date-fns';
import { useEffect, useState } from 'react';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import type { FeedingSession } from '@/types/feeding';

const RESUME_WINDOW_IN_MINUTES = 5;

export function useResumableSession(): FeedingSession | undefined {
	const latestFeedingSession = useLatestFeedingSession();
	const [resumableSession, setResumableSession] = useState<
		FeedingSession | undefined
	>();

	useEffect(() => {
		if (
			!latestFeedingSession ||
			differenceInMinutes(new Date(), new Date(latestFeedingSession.endTime)) >=
				RESUME_WINDOW_IN_MINUTES
		) {
			setResumableSession(undefined);
			return;
		}

		setResumableSession(latestFeedingSession);

		const timeUntilExpiry =
			RESUME_WINDOW_IN_MINUTES * 60 * 1000 -
			(new Date().getTime() - new Date(latestFeedingSession.endTime).getTime());

		const timer = setTimeout(() => {
			setResumableSession(undefined);
		}, timeUntilExpiry);

		return () => clearTimeout(timer);
	}, [latestFeedingSession]);

	return resumableSession;
}
