import { z } from 'zod';

export const medicationAdministrationSchema = z.object({
	administrationStatus: z.enum(['On Time', 'Missed', 'Adjusted'], {
		required_error: 'Administration status is required.',
	}),
	details: z.string().optional(),
	dosageAmount: z
		.number({ invalid_type_error: 'Dosage amount must be a number.' })
		.positive({ message: 'Dosage amount must be positive.' }),
	dosageUnit: z.string().min(1, { message: 'Dosage unit is required.' }),
	medicationName: z
		.string()
		.min(1, { message: 'Medication name is required.' }),
	regimenId: z.string().optional(),
	timestamp: z
		.string()
		.datetime({ message: 'Invalid date and time format.' })
		.min(1, { message: 'Timestamp is required.' }),
	// id is not part of the form validation for creation, it's generated
});

export type MedicationAdministrationFormData = z.infer<
	typeof medicationAdministrationSchema
>;
