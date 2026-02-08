import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { useCallback, useContext, useEffect, useState } from 'react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import {
	FEEDING_IN_PROGRESS_ROW_ID,
	ROW_JSON_CELL,
	ROW_ORDER_CELL,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';

export const useFeedingInProgress = () => {
	const { store } = useContext(tinybaseContext);
	const getCurrentFeedingInProgress = useCallback(() => {
		const json = store.getCell(
			TABLE_IDS.FEEDING_IN_PROGRESS,
			FEEDING_IN_PROGRESS_ROW_ID,
			ROW_JSON_CELL,
		);

		if (typeof json !== 'string') {
			return null;
		}

		try {
			return JSON.parse(json) as FeedingInProgress;
		} catch {
			return null;
		}
	}, [store]);
	const [current, setCurrent] = useState<FeedingInProgress | null>(() =>
		getCurrentFeedingInProgress(),
	);

	useEffect(() => {
		setCurrent(getCurrentFeedingInProgress());
		const listenerId = store.addTableListener(
			TABLE_IDS.FEEDING_IN_PROGRESS,
			() => {
				setCurrent(getCurrentFeedingInProgress());
			},
		);

		return () => {
			store.delListener(listenerId);
		};
	}, [getCurrentFeedingInProgress, store]);

	const set = useCallback(
		(nextFeedingInProgress: FeedingInProgress | null) => {
			if (nextFeedingInProgress === null) {
				if (
					store.hasRow(
						TABLE_IDS.FEEDING_IN_PROGRESS,
						FEEDING_IN_PROGRESS_ROW_ID,
					)
				) {
					store.delRow(
						TABLE_IDS.FEEDING_IN_PROGRESS,
						FEEDING_IN_PROGRESS_ROW_ID,
					);
				}

				localStorage.setItem('feedingInProgress-backup', 'null');
				return;
			}

			const normalized = JSON.parse(
				JSON.stringify(nextFeedingInProgress),
			) as FeedingInProgress;
			store.setRow(TABLE_IDS.FEEDING_IN_PROGRESS, FEEDING_IN_PROGRESS_ROW_ID, {
				[ROW_JSON_CELL]: JSON.stringify(normalized),
				[ROW_ORDER_CELL]: 0,
			});

			localStorage.setItem(
				'feedingInProgress-backup',
				JSON.stringify(normalized),
			);
		},
		[store],
	);

	return [current, set] as const;
};

export type UseFeedingInProgressType = typeof useFeedingInProgress;
