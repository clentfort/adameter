export interface Medication {
	dosage: string;
	endDate: string | null; // ISO date string or null for open-ended
	id: string;
	name: string;
	notes?: string; // Optional
	notificationsEnabled: boolean; // Defaults to true
	prescriberName?: string; // Optional, for 'doctor' or 'other'
	prescriberType: 'doctor' | 'self' | 'other';
	startDate: string; // ISO date string
	timeOfDay?: string; // E.g., "HH:mm", optional
}
