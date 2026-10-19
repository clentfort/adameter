import type { FeedingSession } from '@/types/feeding';
import { useMemo } from 'react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFeedingSessionForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { feedingSessionSchema } from '@/types/feeding';
import { createEntityHooks, createRowParser } from './create-entity-hooks';

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

export function useLatestFeedingSessionRecord(): FeedingSession | undefined {
	const feedingSessions = useFeedingSessionsSnapshot();

	return useMemo(
		() =>
			feedingSessions.reduce<FeedingSession | undefined>(
				(latest, session) =>
					!latest || session.endTime > latest.endTime ? session : latest,
				undefined,
			),
		[feedingSessions],
	);
}
