import { nextBreastAtom } from '@/data/next-breast-atom';
import { useClientOnlyAtom } from './use-client-only-atom';

export const useNextBreast = () => useClientOnlyAtom(nextBreastAtom);
