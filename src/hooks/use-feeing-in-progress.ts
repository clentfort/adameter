import { useCallback, useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { FeedingInProgress } from '@/types/feeding-in-progress';
import { decrypt, encrypt, Encrypted } from '@/utils/crypto'; // Added Encrypted import
import { useEncryptionKey } from './use-encryption-key';

export const useFeedingInProgress = () => {
	const current = useSnapshot(feedingInProgress).current as Encrypted<FeedingInProgress | null> | null;
	const secret = useEncryptionKey();
	const [decryptedCurrent, setDecryptedCurrent] =
		useState<null | FeedingInProgress>(null);
	useEffect(() => {
		if (current === null || secret === undefined) {
			setDecryptedCurrent(null);
		} else {
			setDecryptedCurrent(decrypt(current, secret));
		}
	}, [current, secret]);
	const set = useCallback(
		(nextFeedingInProgress: FeedingInProgress | null) => {
			if (nextFeedingInProgress === null || secret === undefined) {
				feedingInProgress.current = null;
			} else {
				feedingInProgress.current = encrypt(nextFeedingInProgress, secret);
			}
			localStorage.setItem(
				'feedingInProgress-backup',
				JSON.stringify(nextFeedingInProgress),
			);
		},
		[secret],
	);
	return [decryptedCurrent, set] as const;
};
