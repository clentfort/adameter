import { useMemo } from 'react';
import { useMedicationRegimens } from './use-medication-regimens';
import { useMedications } from './use-medications';
import { calculateNextDue } from '@/app/medication/utils/calculate-next-due';
import { MedicationRegimen } from '@/types/medication-regimen';
import { differenceInMinutes } from 'date-fns';

export const useDueMedications = () => {
	const { value: regimens } = useMedicationRegimens();
	const { value: administrations } = useMedications();

	const dueMedications = useMemo(() => {
		const now = new Date();
		return (regimens || []).filter((regimen) => {
			const lastAdministration = (administrations || [])
				.filter((admin) => admin.regimenId === regimen.id)
				.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

			const nextDue = calculateNextDue(regimen, lastAdministration ? new Date(lastAdministration.timestamp) : null);

			if (!nextDue) return false;

			const diff = differenceInMinutes(nextDue, now);
			return diff >= -10 && diff <= 10;
		});
	}, [regimens, administrations]);

	return dueMedications;
};
