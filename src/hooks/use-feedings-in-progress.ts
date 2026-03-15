import type { Row } from 'tinybase';
import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { feedingInProgressSchema } from '@/types/feeding-in-progress';
import { createEntityHooks } from './create-entity-hooks';

function toFeedingInProgress(id: string, row: Row): FeedingInProgress | null {
	const result = feedingInProgressSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		// eslint-disable-next-line no-console
		console.warn('Invalid feeding in progress data:', result.error.issues);
		return null;
	}

	return result.data;
}

const feedingInProgressHooks = createEntityHooks<FeedingInProgress>({
	sanitize: (entity) => {
		const { id, ...rest } = entity;
		return rest as Record<string, string | number | boolean>;
	},
	tableId: TABLE_IDS.FEEDINGS_IN_PROGRESS,
	toEntity: toFeedingInProgress,
});

export const useUpsertFeedingInProgress = feedingInProgressHooks.useUpsert;
export const useRemoveFeedingInProgress = feedingInProgressHooks.useRemove;
export const useFeedingsInProgressSnapshot = feedingInProgressHooks.useSnapshot;
export const useFeedingInProgressIds = feedingInProgressHooks.useIds;
