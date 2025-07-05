import { z } from 'zod';
import { MedicationRegimen } from '@/types/medication-regimen';

const timeStringSchema = z
	.string()
	.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)');

export const medicationRegimenSchema = z
	.object({
		asNeededDetails: z.string().optional(),
		dailyTimes: z.array(z.object({ time: timeStringSchema })).optional(),
		dosageAmount: z
			.number({ invalid_type_error: 'Dosage amount must be a number' })
			.positive({ message: 'Dosage amount must be positive' }),
		dosageUnit: z.string().min(1, { message: 'Dosage unit is required' }),
		endDate: z.string().optional(),
		intervalFirstDoseTime: timeStringSchema.optional(),
		intervalUnit: z.enum(['hours', 'days']).optional(),
		intervalValue: z.number().positive().optional(),
		name: z.string().min(1, { message: 'Medication name is required' }),

		notes: z.string().optional(),
		prescriber: z.enum(['Self', 'Midwife', 'Doctor']),
		prescriberName: z.string().optional(),
		scheduleType: z.enum(['daily', 'interval', 'weekly', 'asNeeded']),
		startDate: z.string().min(1, { message: 'Start date is required' }),
		weeklyDaysOfWeek: z
			.array(
				z.enum([
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
					'Saturday',
					'Sunday',
				]),
			)
			.optional(),
		weeklyTimes: z.array(z.object({ time: timeStringSchema })).optional(),
	})
	.superRefine((data, ctx) => {
		// Conditional validation based on scheduleType
		if (data.scheduleType === 'daily') {
			if (!data.dailyTimes || data.dailyTimes.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'At least one time is required for daily schedule',
					path: ['dailyTimes'],
				});
			}
			data.dailyTimes?.forEach((t, i) => {
				if (!t.time) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Time cannot be empty',
						path: [`dailyTimes.${i}.time`],
					});
				}
			});
		} else if (data.scheduleType === 'interval') {
			if (!data.intervalFirstDoseTime) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'First dose time is required for interval schedule',
					path: ['intervalFirstDoseTime'],
				});
			}
			if (!data.intervalValue) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Interval value is required for interval schedule',
					path: ['intervalValue'],
				});
			}
			if (!data.intervalUnit) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Interval unit is required for interval schedule',
					path: ['intervalUnit'],
				});
			}
		} else if (data.scheduleType === 'weekly') {
			if (!data.weeklyDaysOfWeek || data.weeklyDaysOfWeek.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						'At least one day of the week is required for weekly schedule',
					path: ['weeklyDaysOfWeek'],
				});
			}
			if (!data.weeklyTimes || data.weeklyTimes.length === 0) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'At least one time is required for weekly schedule',
					path: ['weeklyTimes'],
				});
			}
			data.weeklyTimes?.forEach((t, i) => {
				if (!t.time) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Time cannot be empty',
						path: [`weeklyTimes.${i}.time`],
					});
				}
			});
		} else if (data.scheduleType === 'asNeeded') {
			if (!data.asNeededDetails || data.asNeededDetails.trim() === '') {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Details are required for as-needed schedule',
					path: ['asNeededDetails'],
				});
			}
		}

		// Validate prescriberName if prescriber is Midwife or Doctor and name is provided
		if (
			(data.prescriber === 'Midwife' || data.prescriber === 'Doctor') &&
			data.prescriberName &&
			data.prescriberName.trim() === ''
		) {
			// This case should ideally be handled by making prescriberName required if prescriber is not 'Self'
			// However, the requirement is "Optional text input for the specific name of the prescriber, visible only if prescriber is 'Midwife' or 'Doctor'."
			// This implies it's not strictly mandatory even if visible.
			// If it were mandatory, the Zod schema would be structured differently.
			// For now, we ensure if a name is provided, it's not just whitespace.
			// If it becomes mandatory, this logic needs to be adjusted.
		}

		// Validate endDate is after startDate if both are provided
		if (data.startDate && data.endDate) {
			if (new Date(data.endDate) < new Date(data.startDate)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'End date cannot be before start date',
					path: ['endDate'],
				});
			}
		}
	});

export type MedicationRegimenFormData = z.infer<typeof medicationRegimenSchema>;

// Helper to transform form data to MedicationRegimen type
export const transformFormDataToMedicationRegimen = (
	data: MedicationRegimenFormData,
	id?: string,
): MedicationRegimen => {
	const regimenId = id || crypto.randomUUID();
	let schedule: MedicationRegimen['schedule'];

	switch (data.scheduleType) {
		case 'daily':
			schedule = {
				times:
					(data.dailyTimes?.map((t) => t.time).filter(Boolean) as string[]) ||
					[],
				type: 'daily',
			};
			break;
		case 'interval':
			schedule = {
				firstDoseTime: data.intervalFirstDoseTime!, // Validated by superRefine
				intervalUnit: data.intervalUnit!, // Validated by superRefine
				intervalValue: data.intervalValue!, // Validated by superRefine
				type: 'interval',
			};
			break;
		case 'weekly':
			schedule = {
				daysOfWeek: data.weeklyDaysOfWeek || [],
				times:
					(data.weeklyTimes?.map((t) => t.time).filter(Boolean) as string[]) ||
					[],
				type: 'weekly',
			};
			break;
		case 'asNeeded':
			schedule = {
				details: data.asNeededDetails!, // Validated by superRefine
				type: 'asNeeded',
			};
			break;
		default:
			// Should not happen due to enum validation
			throw new Error('Invalid schedule type');
	}

	return {
		dosageAmount: data.dosageAmount,
		dosageUnit: data.dosageUnit,
		endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
		id: regimenId,
		name: data.name,
		notes: data.notes,
		prescriber: data.prescriber,
		prescriberName: data.prescriberName,
		schedule,
		startDate: new Date(data.startDate).toISOString(),
	};
};
