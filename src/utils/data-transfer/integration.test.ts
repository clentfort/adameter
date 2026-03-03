import { describe, expect, it } from 'vitest';
import { fromCsv, toCsv } from './csv';

describe('CSV Integration', () => {
	it('round-trips diaper rows including potty columns', () => {
		const data = [
			{
				containsStool: false,
				containsUrine: true,
				id: 'change-1',
				notes: 'Potty training day',
				pottyStool: true,
				pottyUrine: false,
				temperature: 37.4,
				timestamp: '2026-03-03T08:00:00Z',
			},
		];

		const csv = toCsv(data);
		const parsedData = fromCsv(csv);

		expect(parsedData).toEqual(data);
	});

	it('exports every discovered column across table rows', () => {
		const data = [
			{ id: 'row-1', pottyUrine: true, title: 'first' },
			{ extraMetric: 12, id: 'row-2', title: 'second' },
		];

		const csv = toCsv(data);
		const parsedData = fromCsv(csv);

		expect(parsedData).toEqual([
			{ extraMetric: '', id: 'row-1', pottyUrine: true, title: 'first' },
			{ extraMetric: 12, id: 'row-2', pottyUrine: '', title: 'second' },
		]);
	});

	it('parses booleans and numbers while keeping ids as strings', () => {
		const csv = 'id,enabled,count\n001,true,12\n002,false,0';

		const parsed = fromCsv(csv);

		expect(parsed).toEqual([
			{ count: 12, enabled: true, id: '001' },
			{ count: 0, enabled: false, id: '002' },
		]);
	});

	it('maps legacy diaper abnormalities CSV columns to notes', () => {
		const csv =
			'id,containsUrine,containsStool,abnormalities\nlegacy-1,true,false,Legacy notes';

		const parsed = fromCsv(csv);

		expect(parsed).toEqual([
			{
				containsStool: false,
				containsUrine: true,
				id: 'legacy-1',
				notes: 'Legacy notes',
			},
		]);
	});

	it('keeps JSON value strings untouched in values export', () => {
		const data = [
			{
				id: 'profile',
				value: '{"name":"Ada","optedOut":false}',
			},
		];

		const csv = toCsv(data);
		const parsedData = fromCsv(csv);

		expect(parsedData).toEqual(data);
	});
});
