import type { Row } from 'tinybase';
import type { FeedingSession } from '@/types/feeding';
import { useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFeedingSessionForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { feedingSessionSchema } from '@/types/feeding';
import { createEntityHooks } from './create-entity-hooks';

function toFeedingSession(id: string, row: Row): FeedingSession | null {
	const result = feedingSessionSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		console.warn(
			`Invalid feeding session data for id ${id}:`,
			result.error.issues,
		);
		return null;
	}

	return result.data;
}

const feedingSessionHooks = createEntityHooks<FeedingSession>({
	sanitize: sanitizeFeedingSessionForStore,
	tableId: TABLE_IDS.FEEDING_SESSIONS,
	toEntity: toFeedingSession,
});

export const useUpsertFeedingSession = feedingSessionHooks.useUpsert;
export const useRemoveFeedingSession = feedingSessionHooks.useRemove;
export const useFeedingSession = feedingSessionHooks.useOne;
export const useFeedingSessionsSnapshot = feedingSessionHooks.useSnapshot;
export const useFeedingSessionIds = feedingSessionHooks.useIds;

export function useLatestFeedingSessionRecord() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS, store);

	return useMemo(() => {
		let latestSession: FeedingSession | undefined;

		for (const [sessionId, row] of Object.entries(table)) {
			const session = toFeedingSession(sessionId, row);
			if (!session) {
				continue;
			}
			if (!latestSession || session.endTime > latestSession.endTime) {
				latestSession = session;
			}
		}

		return latestSession;
	}, [table]);
}
