import { differenceInMinutes } from 'date-fns';
import { useEffect, useState } from 'react';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import { usePageVisible } from '@/hooks/use-page-visible';
import type { FeedingSession } from '@/types/feeding';

const RESUME_WINDOW_IN_MINUTES = 5;

const getIsResumable = (session: FeedingSession) =>
	differenceInMinutes(new Date(), new Date(session.endTime)) <
	RESUME_WINDOW_IN_MINUTES;

export function useResumableSession(): FeedingSession | undefined {
	const latestFeedingSession = useLatestFeedingSession();
	const isPageVisible = usePageVisible();
	const [isResumable, setIsResumable] = useState(false);

	useEffect(() => {
		if (!latestFeedingSession) {
			setIsResumable(false);
			return;
		}
		setIsResumable(getIsResumable(latestFeedingSession));
	}, [latestFeedingSession, isPageVisible]);

	return isResumable ? latestFeedingSession : undefined;
}
