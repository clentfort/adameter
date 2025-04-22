import { useAtom } from 'jotai/react';
import { lastUsedDiaperBrandAtom } from '@/data/last-used-diaper-brand-atom';

export const useLastUsedDiaperBrand = () => useAtom(lastUsedDiaperBrandAtom);
