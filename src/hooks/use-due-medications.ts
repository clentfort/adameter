import {
	addMinutes,
	isWithinInterval,
	subMinutes,
} from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { calculateNextDueTimes } from '@/app/medication/utils/calculate-next-due';
import { MedicationRegimen } from '@/types/medication-regimen';
import { useMedicationRegimens } from './use-medication-regimens';
import { useMedications } from './use-medications';

const DUE_WINDOW_MINUTES = 10; // ±10 minutes
const RECENTLY_ADMINISTERED_WINDOW_MINUTES = 30; // Check if administered within ±30 mins of scheduled time

export interface DueMedicationInfo {
	dueTime: Date;
	regimen: MedicationRegimen;
}

export const useDueMedications = (): DueMedicationInfo[] => {
	const { value: regimens } = useMedicationRegimens();
	const { value: administrations } = useMedications();
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		// Update current time every minute to re-evaluate due status
		const timerId = setInterval(() => {
			setCurrentTime(new Date());
		}, 60_000); // 60 seconds

		return () => clearInterval(timerId);
	}, []);

	const dueMedications = useMemo(() => {
		const now = currentTime;
		const windowStart = subMinutes(now, DUE_WINDOW_MINUTES);
		const windowEnd = addMinutes(now, DUE_WINDOW_MINUTES);

		const due: DueMedicationInfo[] = [];

		if (!regimens) {
			return due;
		}

		for (const regimen of regimens) {
			if (regimen.isDiscontinued || regimen.schedule.type === 'asNeeded') {
				continue;
			}

			// Calculate potential due times around 'now'. Look ahead 1 day to catch all relevant times.
			// calculateNextDueTimes already filters by regimen.startDate, regimen.endDate
			const potentialDueSlots = calculateNextDueTimes(regimen, now, 1);

			for (const scheduledTime of potentialDueSlots) {
				// Check 1: Is the scheduled time within our ±10 minute "due now" window?
				if (
					isWithinInterval(scheduledTime, {
						end: windowEnd,
						start: windowStart,
					})
				) {
					// Check 2: Has this specific dose been administered recently?
					// "Recently" means an administration linked to this regimen whose timestamp
					// is close to the *scheduledTime*.
					const adminWindowStart = subMinutes(
						scheduledTime,
						RECENTLY_ADMINISTERED_WINDOW_MINUTES,
					);
					const adminWindowEnd = addMinutes(
						scheduledTime,
						RECENTLY_ADMINISTERED_WINDOW_MINUTES,
					);

					const isAdministered = (administrations || []).some((admin) => {
						if (admin.regimenId !== regimen.id) {
							return false;
						}
						try {
							const adminTimestamp = new Date(admin.timestamp);
							// Check if the administration happened for this specific slot.
							// This means the admin time is close to the scheduledTime.
							return isWithinInterval(adminTimestamp, {
								end: adminWindowEnd,
								start: adminWindowStart,
							});
						} catch {
							// Invalid admin timestamp
							return false;
						}
					});

					if (!isAdministered) {
						due.push({ dueTime: scheduledTime, regimen });
					}
				}
			}
		}
		return due;
	}, [regimens, administrations, currentTime]);

	return dueMedications;
};
