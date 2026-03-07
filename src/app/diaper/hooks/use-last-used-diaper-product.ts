import { useLatestDiaperChangeRecord } from '@/hooks/use-diaper-changes';

export function useLastUsedDiaperProduct() {
	const latestDiaperChange = useLatestDiaperChangeRecord();

	return latestDiaperChange?.diaperProductId;
}
