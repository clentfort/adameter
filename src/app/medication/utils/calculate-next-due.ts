import { format } from 'date-fns';
import { fbt } from 'fbtee';
import { MedicationRegimen } from '@/types/medication-regimen';

export const calculateNextDue = (regimen: MedicationRegimen): string => {
	if (regimen.schedule.type === 'daily' && regimen.schedule.times.length > 0) {
		const now = new Date();
		const todayDateStr = now.toISOString().split('T')[0];
		let nextDueTimeStr = '';

		for (const time of regimen.schedule.times.sort()) {
			const [hours, minutes] = time.split(':').map(Number);
			const potentialNextDue = new Date(todayDateStr);
			potentialNextDue.setHours(hours, minutes, 0, 0);
			if (potentialNextDue > now) {
				nextDueTimeStr = format(potentialNextDue, 'MMMM d, yyyy h:mm a');
				break;
			}
		}

		if (!nextDueTimeStr) {
			const tomorrow = new Date(now);
			tomorrow.setDate(now.getDate() + 1);
			const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
			const firstTimeTomorrow = regimen.schedule.times.sort()[0];
			const [hours, minutes] = firstTimeTomorrow.split(':').map(Number);
			const nextDueTomorrow = new Date(tomorrowDateStr);
			nextDueTomorrow.setHours(hours, minutes, 0, 0);
			nextDueTimeStr = format(nextDueTomorrow, 'MMMM d, yyyy h:mm a');
		}
		return nextDueTimeStr;
	}
	return String(
		fbt(
			'Calculation pending',
			'Placeholder text when next due time calculation is not yet available or supported for the schedule type',
		),
	);
};
