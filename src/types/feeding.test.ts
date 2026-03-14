import { describe, expect, it } from 'vitest';
import { parseFeedingFormValues } from './feeding';

describe('feeding schema transforms', () => {
	it('parses feeding form values into persisted data', () => {
		expect(
			parseFeedingFormValues({
				breast: 'right',
				date: '2026-03-07',
				duration: '10',
				time: '08:15',
			}),
		).toEqual({
			breast: 'right',
			durationInSeconds: 600,
			endTime: '2026-03-07T08:25:00.000Z',
			startTime: '2026-03-07T08:15:00.000Z',
		});
	});
});
