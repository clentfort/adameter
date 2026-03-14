import { z } from 'zod';

export const profileFormSchema = z.object({
	color: z.string().min(1),
	dob: z.string().min(1),
	name: z.string().min(1),
	sex: z.enum(['boy', 'girl']),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export type Sex = 'boy' | 'girl';

export const profileSchema = z.object({
	birthday: z.string().optional(), // Legacy support if needed, but the test uses it
	color: z.string().optional(),
	dob: z.string().optional(), // ISO date string
	name: z.string().optional(),
	optedOut: z.boolean().optional(),
	sex: z.enum(['boy', 'girl']).optional(),
});

export interface Profile {
	birthday?: string; // Included for legacy/test compatibility
	color?: string;
	dob?: string; // ISO date string
	name?: string;
	optedOut?: boolean;
	sex?: Sex;
}
