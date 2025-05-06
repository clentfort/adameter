import { feedingSessions } from '@/data/feeding-sessions';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useFeedingSessions = () =>
	useEncryptedArrayState(feedingSessions, 'feedingSessions-backup');
