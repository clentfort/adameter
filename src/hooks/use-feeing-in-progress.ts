import { useCallback, useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { FeedingInProgress } from '@/types/feeding-in-progress';
import { decrypt, encrypt } from '@/utils/crypto';

export const useFeedingInProgress = () => {
	const current = useSnapshot(feedingInProgress).current;
	const [decryptedCurrent, setDecodedCurrent] = useState(
		decrypt(current, 'secret'),
	);
	useEffect(() => {
		setDecodedCurrent(decrypt(current, 'secret'));
	}, [current]);
	const set = useCallback((nextFeedingInProgress: FeedingInProgress | null) => {
		// @ts-ignore Fix this
		feedingInProgress.current = encrypt(nextFeedingInProgress, 'secret');
	}, []);
	return [decryptedCurrent, set] as const;
};
