import { describe, expect, it } from 'vitest';
import { parseTeethingFormValues } from './teething';

describe('teething schema transforms', () => {
	it('parses teething form values into persisted data', () => {
		expect(
			parseTeethingFormValues({
				date: '2026-03-07',
				notes: '  first tooth  ',
			}),
		).toEqual({
			date: '2026-03-07T12:00:00.000Z',
			notes: 'first tooth',
		});
	});
});
