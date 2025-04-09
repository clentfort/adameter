export interface FeedingSession {
	breast: 'left' | 'right';
	durationInSeconds: number;
	endTime: string;
	id: string;
	startTime: string;
}
