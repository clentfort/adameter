import { feedingsAtom } from '@/data/feedings-atom';
import { useArrayAtom } from './use-array-atom';

export const useFeedingSessions = () => useArrayAtom(feedingsAtom);
