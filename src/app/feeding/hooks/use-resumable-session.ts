import { differenceInMinutes } from 'date-fns';
import { useEffect, useState } from 'react';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import type { FeedingSession } from '@/types/feeding';

const RESUME_WINDOW_IN_MINUTES = 5;

const isResumable = (session: FeedingSession) =>
	differenceInMinutes(new Date(), new Date(session.endTime)) <
	RESUME_WINDOW_IN_MINUTES;

export function useResumableSession(): FeedingSession | undefined {
	const latestFeedingSession = useLatestFeedingSession();
	const [resumableSession, setResumableSession] = useState<
		FeedingSession | undefined
	>();

	useEffect(() => {
		if (!latestFeedingSession || !isResumable(latestFeedingSession)) {
			setResumableSession(undefined);
			return;
		}

		setResumableSession(latestFeedingSession);

		const interval = setInterval(() => {
			if (!isResumable(latestFeedingSession)) {
				setResumableSession(undefined);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [latestFeedingSession]);

	return resumableSession;
}
