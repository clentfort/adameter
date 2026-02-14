export interface FeedingSession {
	breast: 'left' | 'right';
	deviceId?: string;
	durationInSeconds: number;
	endTime: string;
	id: string;
	startTime: string;
}
