import { z } from 'zod';
import { baseEntitySchema } from './base-entity';

export const profileFormSchema = z.object({
	color: z.string().min(1),
	dob: z.string().min(1),
	name: z.string().min(1),
	sex: z.enum(['boy', 'girl']),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export type Sex = 'boy' | 'girl';

export const profileDataSchema = z.object({
	birthday: z.string().optional(), // Legacy support if needed, but the test uses it
	color: z.string().optional(),
	dob: z.string().optional(), // ISO date string
	name: z.string().optional(),
	optedOut: z.boolean().optional(),
	sex: z.enum(['boy', 'girl']).optional(),
});

export const profileSchema = baseEntitySchema.extend(profileDataSchema.shape);

export type ProfileData = z.infer<typeof profileDataSchema>;

export interface Profile {
	birthday?: string; // Included for legacy/test compatibility
	color?: string;
	deviceId?: string;
	dob?: string; // ISO date string
	id: string;
	name?: string;
	optedOut?: boolean;
	sex?: Sex;
}
