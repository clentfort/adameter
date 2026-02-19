export type Sex = 'boy' | 'girl';

export interface Profile {
	dob?: string; // ISO date string
	optedOut?: boolean;
	sex?: Sex;
}
