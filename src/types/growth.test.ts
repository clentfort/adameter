import { describe, expect, it } from 'vitest';
import { parseGrowthFormValues } from './growth';

describe('growth schema transforms', () => {
	it('parses growth form values into persisted data', () => {
		expect(
			parseGrowthFormValues({
				date: '2026-03-07',
				headCircumference: '35.4',
				height: '',
				notes: '  doing well  ',
				weight: '4200',
			}),
		).toEqual({
			date: '2026-03-07T12:00:00.000Z',
			headCircumference: 35.4,
			height: undefined,
			notes: 'doing well',
			weight: 4200,
		});
	});
});
