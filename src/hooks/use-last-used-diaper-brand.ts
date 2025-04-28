import { lastUsedDiaperBrandAtom } from '@/data/last-used-diaper-brand-atom';
import { useClientOnlyAtom } from './use-client-only-atom';

export const useLastUsedDiaperBrand = () =>
	useClientOnlyAtom(lastUsedDiaperBrandAtom);
