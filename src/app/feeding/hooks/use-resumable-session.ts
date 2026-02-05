import type { FeedingSession } from '@/types/feeding';
import { differenceInMinutes } from 'date-fns';
import { useMemo, useSyncExternalStore } from 'react';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';

const RESUME_WINDOW_IN_MINUTES = 5;

const RESUME_WINDOW_MS = RESUME_WINDOW_IN_MINUTES * 60 * 1000;

const createExpiryStore = (expiryTime: number | null) => {
	let now = Date.now();
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	const listeners = new Set<() => void>();

	const notify = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	const updateNow = () => {
		now = Date.now();
		notify();
	};

	const clearTimer = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	const schedule = () => {
		if (expiryTime == null) {
			return;
		}
		const remainingMs = Math.max(expiryTime - Date.now(), 0);
		if (remainingMs === 0) {
			updateNow();
			return;
		}
		timeoutId = setTimeout(updateNow, remainingMs);
	};

	const handleVisibilityChange = () => {
		if (document.visibilityState === 'hidden') {
			clearTimer();
			return;
		}
		clearTimer();
		updateNow();
		schedule();
	};

	const subscribe = (listener: () => void) => {
		listeners.add(listener);
		now = Date.now();
		if (document.visibilityState !== 'hidden') {
			schedule();
		}
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			listeners.delete(listener);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (listeners.size === 0) {
				clearTimer();
			}
		};
	};

	const getSnapshot = () => now;

	return { getSnapshot, subscribe };
};

const getIsResumable = (session: FeedingSession, now: number) =>
	differenceInMinutes(new Date(now), new Date(session.endTime)) <
	RESUME_WINDOW_IN_MINUTES;

export function useResumableSession(): FeedingSession | undefined {
	const latestFeedingSession = useLatestFeedingSession();
	const expiryTime = latestFeedingSession
		? new Date(latestFeedingSession.endTime).getTime() + RESUME_WINDOW_MS
		: null;
	const expiryStore = useMemo(
		() => createExpiryStore(expiryTime),
		[expiryTime],
	);
	const now = useSyncExternalStore(
		expiryStore.subscribe,
		expiryStore.getSnapshot,
		expiryStore.getSnapshot,
	);

	return useMemo(() => {
		if (!latestFeedingSession) {
			return undefined;
		}

		return getIsResumable(latestFeedingSession, now)
			? latestFeedingSession
			: undefined;
	}, [latestFeedingSession, now]);
}
