import type { BaseEntity } from './base-entity';

export interface Event extends BaseEntity {
	// point = single date, period = start to end date
	color?: string;
	description?: string;
	// ISO string
	endDate?: string;
	startDate: string;
	title: string;
	// ISO string, optional for ongoing events
	type: 'point' | 'period'; // Optional color for the event
}
