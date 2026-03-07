import type { Row } from 'tinybase';
import type { FeedingSession } from '@/types/feeding';
import { useCallback, useMemo } from 'react';
import { useRow, useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFeedingSessionForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { getDeviceId } from '@/utils/device-id';

function toFeedingSession(id: string, row: Row): FeedingSession {
	return {
		...row,
		id,
	} as FeedingSession;
}

interface FeedingSessionListEntry {
	id: string;
	startTime: string;
}

export function useUpsertFeedingSession() {
	const store = useStore()!;

	return useCallback(
		(session: FeedingSession) => {
			const cells = sanitizeFeedingSessionForStore(session);
			if (!cells) {
				return;
			}

			store.setRow(TABLE_IDS.FEEDING_SESSIONS, session.id, {
				...cells,
				deviceId: getDeviceId(),
			});
		},
		[store],
	);
}

export function useRemoveFeedingSession() {
	const store = useStore()!;

	return useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.FEEDING_SESSIONS, id);
		},
		[store],
	);
}

export function useFeedingSession(sessionId: string | undefined) {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.FEEDING_SESSIONS, sessionId ?? '', store);

	return useMemo(() => {
		if (!sessionId || Object.keys(row).length === 0) {
			return undefined;
		}

		return toFeedingSession(sessionId, row);
	}, [row, sessionId]);
}

export function useSortedFeedingSessionListEntries() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS, store);

	return useMemo(
		() =>
			Object.entries(table)
				.sort(([, a], [, b]) => {
					const aStart = typeof a.startTime === 'string' ? a.startTime : '';
					const bStart = typeof b.startTime === 'string' ? b.startTime : '';
					return bStart.localeCompare(aStart);
				})
				.map(
					([sessionId, row]) =>
						({
							id: sessionId,
							startTime: typeof row.startTime === 'string' ? row.startTime : '',
						}) satisfies FeedingSessionListEntry,
				),
		[table],
	);
}

export function useFeedingSessionsSnapshot() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS, store);

	return useMemo(
		() =>
			Object.entries(table).map(([sessionId, row]) =>
				toFeedingSession(sessionId, row),
			),
		[table],
	);
}

export function useLatestFeedingSessionRecord() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS, store);

	return useMemo(() => {
		let latestSession: FeedingSession | undefined;

		for (const [sessionId, row] of Object.entries(table)) {
			const session = toFeedingSession(sessionId, row);
			if (!latestSession || session.endTime > latestSession.endTime) {
				latestSession = session;
			}
		}

		return latestSession;
	}, [table]);
}
