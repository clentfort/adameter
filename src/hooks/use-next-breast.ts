import { useAtom } from 'jotai/react';
import { nextBreastAtom } from '@/data/next-breast-atom';

export const useNextBreast = () => useAtom(nextBreastAtom);
