import { z } from 'zod';

export const profileFormSchema = z.object({
	color: z.string().min(1),
	dob: z.string().min(1),
	name: z.string().min(1),
	sex: z.enum(['boy', 'girl']),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export type Sex = 'boy' | 'girl';

export interface Profile {
	color?: string;
	dob?: string; // ISO date string
	name?: string;
	optedOut?: boolean;
	sex?: Sex;
}
