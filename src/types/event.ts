export interface Event {
	// point = single date, period = start to end date
	color?: string;
	description?: string;
	deviceId?: string;
	// ISO string
	endDate?: string;
	id: string;
	startDate: string;
	title: string;
	// ISO string, optional for ongoing events
	type: 'point' | 'period'; // Optional color for the event
}
