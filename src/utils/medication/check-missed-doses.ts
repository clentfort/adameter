import type {
	MedicationAdministration,
	MedicationRegimen,
} from '@/types/medication';
import { getDeviceId } from '../device-id';

export function checkMissedDoses(
	regimens: MedicationRegimen[],
	administrations: MedicationAdministration[],
): MedicationAdministration[] {
	const now = new Date();
	const newSkips: MedicationAdministration[] = [];

	for (const regimen of regimens) {
		if (regimen.status !== 'active' || regimen.type !== 'fixed' || !regimen.times) {
			continue;
		}

		const regimenAdmins = administrations
			.filter((a) => a.regimenId === regimen.id)
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			);

		const lastAction = regimenAdmins[0];
		const lastActionTime = lastAction
			? new Date(lastAction.timestamp)
			: new Date(regimen.startDate);

		// Generate all scheduled times between lastActionTime and now
		const missedTimes = getScheduledTimesBetween(
			lastActionTime,
			now,
			regimen.times,
		);

		// If there's more than one missed time, all but the last one are "skipped"
		// The last one remains as the "active" overdue reminder
		if (missedTimes.length > 1) {
			for (let i = 0; i < missedTimes.length - 1; i++) {
				const missedTime = missedTimes[i];
				const missedTimeIso = missedTime.toISOString();

				// Check if we already have an entry for this regimen and timestamp
				const alreadyRecorded = administrations.some(
					(a) => a.regimenId === regimen.id && a.timestamp === missedTimeIso,
				);

				if (!alreadyRecorded) {
					newSkips.push({
						deviceId: getDeviceId(),
						dosage: regimen.dosage,
						id: crypto.randomUUID(),
						name: regimen.name,
						prescribedBy: regimen.prescribedBy,
						regimenId: regimen.id,
						status: 'skipped',
						timestamp: missedTimeIso,
						unit: regimen.unit,
					});
				}
			}
		}
	}

	return newSkips;
}

function getScheduledTimesBetween(
	start: Date,
	end: Date,
	times: string[],
): Date[] {
	const scheduledDates: Date[] = [];
	const current = new Date(start);
	// Start from the day of 'start'
	current.setHours(0, 0, 0, 0);

	const endTimestamp = end.getTime();

	// Limit to a reasonable number of days to avoid infinite loops if dates are messed up
	const maxDays = 31;
	let daysProcessed = 0;

	while (current.getTime() <= endTimestamp && daysProcessed < maxDays) {
		for (const timeStr of times) {
			const [hours, minutes] = timeStr.split(':').map(Number);
			const scheduled = new Date(current);
			scheduled.setHours(hours, minutes, 0, 0);

			if (scheduled > start && scheduled <= end) {
				scheduledDates.push(scheduled);
			}
		}
		current.setDate(current.getDate() + 1);
		daysProcessed++;
	}

	return scheduledDates.sort((a, b) => a.getTime() - b.getTime());
}
