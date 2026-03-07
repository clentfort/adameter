import type { FeedingSession } from '@/types/feeding';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFeedingSessionForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { useTinybaseEntityTable } from './use-tinybase-entity-table';

export const useFeedingSessions = () =>
	useTinybaseEntityTable<FeedingSession>(
		TABLE_IDS.FEEDING_SESSIONS,
		sanitizeFeedingSessionForStore,
	);
