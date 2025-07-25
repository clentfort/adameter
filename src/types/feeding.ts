export type FeedingSource = 'left' | 'right' | 'bottle';

export interface FeedingSession {
	// The amount in ml of milk consumed. Only applicable for bottle feeding.
	amountInMl?: number;
	// We're re-using the breast property to denote the source of the feeding.
	// This can be either the breast, or a bottle.
	breast: FeedingSource;
	// The duration of the feeding in seconds. Only applicable for breast feeding.
	durationInSeconds?: number;
	endTime: string;
	id: string;
	startTime: string;
}
