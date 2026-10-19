import type { FeedingSession } from '@/types/feeding';
import { useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFeedingSessionForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { feedingSessionSchema } from '@/types/feeding';
import { createEntityHooks, createRowParser } from './create-entity-hooks';
import { useSelectedProfileId } from './use-selected-profile-id';

const toFeedingSession = createRowParser(
	feedingSessionSchema,
	'feeding session',
);

const feedingSessionHooks = createEntityHooks<FeedingSession>({
	sanitize: sanitizeFeedingSessionForStore,
	tableId: TABLE_IDS.FEEDING_SESSIONS,
	toEntity: toFeedingSession,
});

export const useUpsertFeedingSession = feedingSessionHooks.useUpsert;
export const useRemoveFeedingSession = feedingSessionHooks.useRemove;
export const useFeedingSession = feedingSessionHooks.useOne;
export const useFeedingSessionsSnapshot = feedingSessionHooks.useSnapshot;

export function useLatestFeedingSessionRecord() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS, store);
	const [selectedProfileId] = useSelectedProfileId();

	return useMemo(() => {
		let latestSession: FeedingSession | undefined;

		for (const [sessionId, row] of Object.entries(table)) {
			if (selectedProfileId && row.profileId !== selectedProfileId) {
				continue;
			}
			const session = toFeedingSession(sessionId, row);
			if (!session) {
				continue;
			}
			if (!latestSession || session.endTime > latestSession.endTime) {
				latestSession = session;
			}
		}

		return latestSession;
	}, [table, selectedProfileId]);
}
