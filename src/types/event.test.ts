import { describe, expect, it } from 'vitest';
import { parseEventFormValues } from './event';

describe('event schema transforms', () => {
	it('parses event form values into persisted data', () => {
		expect(
			parseEventFormValues({
				color: '#123456',
				description: '  milestone  ',
				endDate: '2026-03-07',
				endTime: '08:30',
				hasEndDate: true,
				startDate: '2026-03-07',
				startTime: '08:00',
				title: '  Checkup  ',
				type: 'period',
			}),
		).toEqual({
			color: '#123456',
			description: 'milestone',
			endDate: '2026-03-07T08:30:00.000Z',
			startDate: '2026-03-07T08:00:00.000Z',
			title: 'Checkup',
			type: 'period',
		});
	});
});
