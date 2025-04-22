import { diapersAtom } from '@/data/diapers-atom';
import { useArrayAtom } from './use-array-atom';

export const useDiaperChanges = () => useArrayAtom(diapersAtom);
