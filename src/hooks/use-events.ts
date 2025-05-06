import { events } from '@/data/events';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useEvents = () => useEncryptedArrayState(events, 'events-backup');
