import { useMemo } from 'react';
import { useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useSelectedProfileId } from './use-selected-profile-id';

export const useTodayDiaperStats = () => {
	const table = useTable(TABLE_IDS.DIAPER_CHANGES);
	const [selectedProfileId] = useSelectedProfileId();

	return useMemo(() => {
		let urineCount = 0;
		let stoolCount = 0;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (const row of Object.values(table)) {
			if (selectedProfileId && row.profileId !== selectedProfileId) {
				continue;
			}
			const timestamp = new Date(row.timestamp as string);
			if (timestamp >= today) {
				const hasUrine = row.containsUrine || row.pottyUrine;
				const hasStool = row.containsStool || row.pottyStool;

				if (hasUrine) {
					urineCount++;
				}
				if (hasStool) {
					stoolCount++;
				}
			}
		}

		return { stoolCount, urineCount };
	}, [table, selectedProfileId]);
};
