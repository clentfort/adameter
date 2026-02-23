export type Sex = 'boy' | 'girl';

export interface Profile {
	color?: string;
	dob?: string; // ISO date string
	name?: string;
	optedOut?: boolean;
	sex?: Sex;
}
