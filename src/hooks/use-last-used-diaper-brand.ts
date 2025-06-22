import { useLatestDiaperChange } from './use-latest-diaper-change';

export const useLastUsedDiaperBrand = () => {
	const latestDiaperChange = useLatestDiaperChange();
	return latestDiaperChange?.diaperBrand ?? 'andere';
};
