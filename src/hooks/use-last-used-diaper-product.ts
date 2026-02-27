import { useLatestDiaperChange } from './use-latest-diaper-change';

export const useLastUsedDiaperProduct = () => {
	const latestDiaperChange = useLatestDiaperChange();
	return latestDiaperChange?.diaperProductId;
};
