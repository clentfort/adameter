
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fromCsv, mergeData } from './csv';
import * as diaperChangesData from '@/data/diaper-changes';
import Papa from 'papaparse';

vi.mock('papaparse');

describe('Import CSV', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('fromCsv', () => {
		it('should parse a CSV string', () => {
			(Papa.parse as any).mockReturnValue({
				data: [{ id: '1' }, { id: '2' }],
			});

			const data = fromCsv('csv-string');

			expect(Papa.parse).toHaveBeenCalledWith('csv-string', {
				header: true,
				skipEmptyLines: true,
			});
			expect(data).toEqual([{ id: '1' }, { id: '2' }]);
		});
	});

	describe('mergeData', () => {
		it('should merge data into the data stores', () => {
			const diaperChangesPush = vi.fn();
			const diaperChanges = [{ id: '0' }];
			vi.spyOn(diaperChangesData, 'diaperChanges', 'get').mockReturnValue(
				diaperChanges as any,
			);
			diaperChanges.push = diaperChangesPush;

			const data = [{ id: '1' }, { id: '2' }];
			mergeData('diaperChanges', data);

			expect(diaperChangesPush).toHaveBeenCalledTimes(2);
		});
	});
});
