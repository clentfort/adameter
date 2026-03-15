import type { FeedingSession } from '../../types/feeding';

let feedingCounter = 0;

function buildEndTime(startTime: string, durationInSeconds: number) {
	return new Date(
		new Date(startTime).getTime() + durationInSeconds * 1000,
	).toISOString();
}

export function createFeedingSession(
	overrides: Partial<FeedingSession> = {},
): FeedingSession {
	feedingCounter += 1;

	const startTime = overrides.startTime ?? '2024-01-01T00:00:00Z';
	const durationInSeconds = overrides.durationInSeconds ?? 600;

	return {
		breast: 'left',
		durationInSeconds,
		endTime: buildEndTime(startTime, durationInSeconds),
		id: `feeding-${feedingCounter}`,
		startTime,
		type: 'breast',
		...overrides,
	};
}

export function createFeedingSessions(
	overrides: Array<Partial<FeedingSession>>,
) {
	return overrides.map((override) => createFeedingSession(override));
}
