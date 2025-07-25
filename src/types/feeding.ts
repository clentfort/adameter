export type FeedingSource = 'left' | 'right' | 'bottle' | 'pump';

export interface FeedingSession {
	source: FeedingSource;
	amountInMl?: number;
	durationInSeconds?: number;
	endTime: string;
	id: string;
	startTime:string;
}
