
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toCsv } from './csv';

describe('Export CSV', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('toCsv', () => {
		it('should convert data to a CSV string', () => {
			const data = [
				{ id: '1', name: 'test' },
				{ id: '2', name: 'test2', timestamp: '2022-01-01' },
			];

			const csv = toCsv('diaperChanges', data);

			expect(csv).toBe(
				'id,timestamp,containsUrine,containsStool,abnormalities,diaperBrand,leakage,temperature\r\n"1",,,,,,\r\n"2","2022-01-01",,,,,',
			);
		});
	});
});
