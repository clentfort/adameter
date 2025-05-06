import { useDiaperChanges } from './use-diaper-changes';

export const useLastUsedDiaperBrand = () => {
	const { value: diaperChanges } = useDiaperChanges();
	return diaperChanges[0]?.diaperBrand ?? 'andere';
};
