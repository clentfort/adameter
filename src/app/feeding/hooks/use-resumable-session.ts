import { differenceInMinutes } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import type { FeedingSession } from '@/types/feeding';

const RESUME_WINDOW_IN_MINUTES = 5;

const getIsResumable = (session: FeedingSession) =>
	differenceInMinutes(new Date(), new Date(session.endTime)) <
	RESUME_WINDOW_IN_MINUTES;

export function useResumableSession(): FeedingSession | undefined {
	const latestFeedingSession = useLatestFeedingSession();
	const [resumableSession, setResumableSession] = useState<
		FeedingSession | undefined
	>();

	const manageTimeout = useCallback(() => {
		if (!latestFeedingSession || !getIsResumable(latestFeedingSession)) {
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

		return timer;
	}, [latestFeedingSession]);

	useEffect(() => {
		let timer = manageTimeout();

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				if (timer) clearTimeout(timer);
			} else {
				timer = manageTimeout();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (timer) clearTimeout(timer);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [manageTimeout]);

	return resumableSession;
}
