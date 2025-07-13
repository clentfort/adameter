import { MedicationRegimen } from '@/types/medication-regimen';
import { add, set } from 'date-fns';

export const calculateNextDue = (
	regimen: MedicationRegimen,
	lastAdministrationTime: Date | null,
): Date | null => {
	const now = new Date();
	if (regimen.isDiscontinued) return null;
	if (regimen.endDate && new Date(regimen.endDate) < now) return null;
	if (regimen.schedule.type === 'asNeeded') return null;

	const startDate = new Date(regimen.startDate);

	switch (regimen.schedule.type) {
		case 'daily': {
			const scheduleTimes = regimen.schedule.times.map((time) => {
				const [hours, minutes] = time.split(':').map(Number);
				return set(startDate, { hours, minutes, seconds: 0, milliseconds: 0 });
			});

			let nextDue = null;
			for (const time of scheduleTimes) {
				let potentialNextDue = time;
				while (potentialNextDue < now) {
					potentialNextDue = add(potentialNextDue, { days: 1 });
				}
				if (!nextDue || potentialNextDue < nextDue) {
					nextDue = potentialNextDue;
				}
			}
			return nextDue;
		}
		case 'interval': {
			const { intervalValue, intervalUnit, firstDoseTime } = regimen.schedule;
			const [hours, minutes] = firstDoseTime.split(':').map(Number);
			const firstDoseDateTime = set(startDate, {
				hours,
				minutes,
				seconds: 0,
				milliseconds: 0,
			});

			let nextDue = firstDoseDateTime;
			if (lastAdministrationTime) {
				nextDue = add(lastAdministrationTime, { [intervalUnit]: intervalValue });
			}

			while (nextDue < now) {
				nextDue = add(nextDue, { [intervalUnit]: intervalValue });
			}

			return nextDue;
		}
		case 'weekly': {
			const { daysOfWeek, times } = regimen.schedule;
			const dayMapping = {
				Sunday: 0,
				Monday: 1,
				Tuesday: 2,
				Wednesday: 3,
				Thursday: 4,
				Friday: 5,
				Saturday: 6,
			};

			let nextDue = null;

			for (const day of daysOfWeek) {
				for (const time of times) {
					const [hours, minutes] = time.split(':').map(Number);
					let potentialNextDue = set(startDate, {
						hours,
						minutes,
						seconds: 0,
						milliseconds: 0,
					});
					potentialNextDue.setDate(
						potentialNextDue.getDate() +
							((dayMapping[day] - potentialNextDue.getDay() + 7) % 7),
					);

					while (potentialNextDue < now) {
						potentialNextDue = add(potentialNextDue, { weeks: 1 });
					}

					if (!nextDue || potentialNextDue < nextDue) {
						nextDue = potentialNextDue;
					}
				}
			}
			return nextDue;
		}
		default:
			return null;
	}
};
