export interface Event {
	// point = single date, period = start to end date
	color?: string;
	description?: string;
	// ISO string
	endDate?: string;
	id: string;
	date: string; // Renamed from startDate for generic usage
	title?: string; // Made optional
	// ISO string, optional for ongoing events
	type?: 'point' | 'period'; // Made optional // Optional color for the event
}
