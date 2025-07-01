import { fbt } from 'fbtee';
import { MedicationRegimen } from '@/types/medication-regimen';

export const formatSchedule = (schedule: MedicationRegimen['schedule']) => {
	switch (schedule.type) {
		case 'daily':
			return fbt(
				`Daily at ${fbt.param('times', schedule.times.join(', '))}`,
				'Schedule format for daily medication at specific times',
			);
		case 'interval':
			return fbt(
				`Every ${fbt.param('intervalValue', schedule.intervalValue)} ${fbt.param('intervalUnit', schedule.intervalUnit)}, first dose at ${fbt.param('firstDoseTime', schedule.firstDoseTime)}`,
				'Schedule format for interval medication',
			);
		case 'weekly':
			return fbt(
				`Weekly on ${fbt.param('daysOfWeek', schedule.daysOfWeek.join(', '))} at ${fbt.param('times', schedule.times.join(', '))}`,
				'Schedule format for weekly medication',
			);
		case 'asNeeded':
			return fbt(
				`As needed: ${fbt.param('details', schedule.details)}`,
				'Schedule format for as-needed medication',
			);
		default:
			return String(fbt('N/A', 'Not applicable or not available'));
	}
};
