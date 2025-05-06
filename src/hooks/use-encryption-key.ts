import { useSnapshot } from 'valtio';
import { passphrase } from '@/data/passphrase';

export function useEncryptionKey() {
	return useSnapshot(passphrase).current;
}
