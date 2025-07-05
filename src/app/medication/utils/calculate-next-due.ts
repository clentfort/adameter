import {
	addDays,
	addHours,
	compareAsc,
	isAfter,
	isBefore,
	isValid,
	max,
	min,
	parseISO,
	set,
	startOfDay,
	format, // Added for calculateNextDue
} from 'date-fns';
import { fbt } from 'fbtee'; // Added for calculateNextDue
import {
	MedicationRegimen,
	MedicationSchedule,
} from '@/types/medication-regimen';

/**
 * Calculates the next due administration times for a given medication regimen.
 *
 * @param regimen The medication regimen.
 * @param now The current date and time (or a reference time for testing).
 * @param lookaheadDays How many days in the future to look for schedules.
 * @returns An array of Date objects representing upcoming due times, sorted chronologically.
 *          Returns an empty array if the regimen is discontinued, past its end date,
 *          not yet started, 'asNeeded', or has no valid upcoming times within the lookahead.
 */
export const calculateNextDueTimes = (
	regimen: MedicationRegimen,
	now: Date,
	lookaheadDays = 2, // Look ahead 2 days by default (today and tomorrow)
): Date[] => {
	if (regimen.isDiscontinued) {
		return [];
	}
	if (regimen.schedule.type === 'asNeeded') {
		return [];
	}

	const overallLookaheadBoundary = addDays(startOfDay(now), lookaheadDays);
	const regimenStartDate = parseISO(regimen.startDate);

	if (
		!isValid(regimenStartDate) ||
		isAfter(regimenStartDate, overallLookaheadBoundary)
	) {
		// Regimen start date is invalid or too far in the future relative to the lookahead period
		return [];
	}

	const regimenEndDate = regimen.endDate ? parseISO(regimen.endDate) : null;
	if (
		regimenEndDate &&
		isValid(regimenEndDate) &&
		isBefore(regimenEndDate, startOfDay(now))
	) {
		// Regimen has already ended before today
		return [];
	}

	const upcomingDueTimes: Date[] = [];
	// Effective start for iteration should be today or regimen start, whichever is later.
	const iterationStartDate = max([startOfDay(now), regimenStartDate]);
	// Effective end for iteration is the lookahead boundary or regimen end, whichever is sooner.
	// overallLookaheadBoundary is the START of the day AFTER the last lookahead day.
	// So, iterationEndDate will be exclusive for isBefore checks.
	const iterationEndDate = regimenEndDate
		? min([overallLookaheadBoundary, regimenEndDate])
		: overallLookaheadBoundary;

	switch (regimen.schedule.type) {
		case 'daily':
			generateDailyTimes(
				regimen.schedule,
				iterationStartDate,
				iterationEndDate, // Exclusive end boundary
				now,
				upcomingDueTimes,
			);
			break;
		case 'interval':
			generateIntervalTimes(
				regimen.schedule,
				regimenStartDate,
				iterationEndDate, // Exclusive end boundary
				now,
				upcomingDueTimes,
			);
			break;
		case 'weekly':
			generateWeeklyTimes(
				regimen.schedule,
				iterationStartDate,
				iterationEndDate, // Exclusive end boundary
				now,
				upcomingDueTimes,
			);
			break;
		default:
			return [];
	}

	return upcomingDueTimes.sort(compareAsc);
};

const generateDailyTimes = (
	schedule: Extract<MedicationSchedule, { type: 'daily' }>,
	iterationStartDate: Date,
	iterationEndDate: Date, // Exclusive boundary
	now: Date,
	dueTimes: Date[],
) => {
	if (schedule.times.length === 0) return;

	let currentDay = startOfDay(iterationStartDate);
	while (isBefore(currentDay, iterationEndDate)) {
		for (const timeStr of schedule.times.sort()) {
			const [hours, minutes] = timeStr.split(':').map(Number);
			const potentialDueTime = set(currentDay, {
				hours,
				milliseconds: 0,
				minutes,
				seconds: 0,
			});

			// Must be after 'now' and strictly before the iterationEndDate
			if (
				isAfter(potentialDueTime, now) &&
				isBefore(potentialDueTime, iterationEndDate)
			) {
				dueTimes.push(potentialDueTime);
			}
		}
		currentDay = addDays(currentDay, 1);
	}
};

const generateIntervalTimes = (
	schedule: Extract<MedicationSchedule, { type: 'interval' }>,
	regimenStartDate: Date,
	iterationEndDate: Date, // Exclusive boundary
	now: Date,
	dueTimes: Date[],
) => {
	const [startHours, startMinutes] = schedule.firstDoseTime
		.split(':')
		.map(Number);
	let nextDoseTime = set(regimenStartDate, {
		hours: startHours,
		milliseconds: 0,
		minutes: startMinutes,
		seconds: 0,
	});

	if (isBefore(nextDoseTime, now)) {
		const diffMillis = now.getTime() - nextDoseTime.getTime();
		const intervalMillis =
			schedule.intervalValue *
			(schedule.intervalUnit === 'hours' ? 3_600_000 : 86_400_000);
		if (intervalMillis > 0) {
			const numIntervalsToSkip = Math.floor(diffMillis / intervalMillis);
			const advancementUnit =
				schedule.intervalUnit === 'hours' ? 'hours' : 'days';
			const advancementValue = numIntervalsToSkip * schedule.intervalValue;

			nextDoseTime = advancementUnit === 'hours' ? addHours(nextDoseTime, advancementValue) : addDays(nextDoseTime, advancementValue);

			while (isBefore(nextDoseTime, now)) {
				nextDoseTime =
					schedule.intervalUnit === 'hours'
						? addHours(nextDoseTime, schedule.intervalValue)
						: addDays(nextDoseTime, schedule.intervalValue);
			}
		}
	}

	while (isBefore(nextDoseTime, iterationEndDate)) {
		// Only add if strictly after 'now' and strictly before iterationEndDate
		if (
			isAfter(nextDoseTime, now) &&
			isBefore(nextDoseTime, iterationEndDate)
		) {
			dueTimes.push(new Date(nextDoseTime));
		}

		const prevDoseTime = new Date(nextDoseTime);
		nextDoseTime =
			schedule.intervalUnit === 'hours'
				? addHours(nextDoseTime, schedule.intervalValue)
				: addDays(nextDoseTime, schedule.intervalValue);

		if (compareAsc(nextDoseTime, prevDoseTime) <= 0) break;
	}
};

const generateWeeklyTimes = (
	schedule: Extract<MedicationSchedule, { type: 'weekly' }>,
	iterationStartDate: Date,
	iterationEndDate: Date, // Exclusive boundary
	now: Date,
	dueTimes: Date[],
) => {
	if (schedule.times.length === 0 || schedule.daysOfWeek.length === 0) return;

	const dayMapping: Record<string, number> = {
		Friday: 5,
		Monday: 1,
		Saturday: 6,
		Sunday: 0,
		Thursday: 4,
		Tuesday: 2,
		Wednesday: 3,
	};
	const scheduledDays = schedule.daysOfWeek
		.map((day) => dayMapping[day])
		.filter((d) => d !== undefined);

	let currentDay = startOfDay(iterationStartDate);
	while (isBefore(currentDay, iterationEndDate)) {
		if (scheduledDays.includes(currentDay.getDay())) {
			for (const timeStr of schedule.times.sort()) {
				const [hours, minutes] = timeStr.split(':').map(Number);
				const potentialDueTime = set(currentDay, {
					hours,
					milliseconds: 0,
					minutes,
					seconds: 0,
				});

				// Must be after 'now' and strictly before iterationEndDate
				if (
					isAfter(potentialDueTime, now) &&
					isBefore(potentialDueTime, iterationEndDate)
				) {
					dueTimes.push(potentialDueTime);
				}
			}
		}
		currentDay = addDays(currentDay, 1);
	}
};

// This is the old function signature, kept for compatibility if other parts of the app use it directly.
// However, its usage should be phased out in favor of calculateNextDueTimes for more precise results.
// For now, it can be a simplified wrapper or removed if no longer directly used.
// The plan is to create a new hook `useDueMedications` which will use `calculateNextDueTimes`.
// The existing `RegimenAccordionContent` uses a `formatSchedule` utility, not this directly for display.
// Let's assume for now this old export is not strictly needed for the "quick submit" feature.
// If it is, we can adapt one of the new `Date` results back into a string.


export const calculateNextDue = (regimen: MedicationRegimen): string => {
	const now = new Date();
	// For simplicity, get the very next due time using the new function
	// Look ahead 7 days for this simple version to find at least one upcoming time for display
	const nextTimes = calculateNextDueTimes(regimen, now, 7);
	if (nextTimes.length > 0) {
		// Format the first upcoming time as per the old function's output
		return format(nextTimes[0], 'MMMM d, yyyy h:mm a');
	}

	// Fallback message if no upcoming times or not applicable
	return String(
		fbt(
			'Calculation pending',
			'Placeholder text when next due time calculation is not yet available or supported for the schedule type',
		),
	);
};
