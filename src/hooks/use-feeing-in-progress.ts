import { useCallback, useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { FeedingInProgress } from '@/types/feeding-in-progress';
import { decrypt, encrypt } from '@/utils/crypto';
import { useEncryptionKey } from './use-encryption-key';

export const useFeedingInProgress = () => {
	const current = useSnapshot(feedingInProgress).current;
	const secret = useEncryptionKey();
	const [decryptedCurrent, setDecryptedCurrent] =
		useState<null | FeedingInProgress>(null);
	useEffect(() => {
		if (current === null) {
			setDecryptedCurrent(null);
		} else {
			setDecryptedCurrent(decrypt(current, secret));
		}
	}, [current, secret]);
	const set = useCallback(
		(nextFeedingInProgress: FeedingInProgress | null) => {
			// @ts-ignore Fix this
			feedingInProgress.current = encrypt(nextFeedingInProgress, secret);
			localStorage.setItem(
				'feedingInProgress-backup',
				JSON.stringify(nextFeedingInProgress),
			);
		},
		[secret],
	);
	return [decryptedCurrent, set] as const;
};
