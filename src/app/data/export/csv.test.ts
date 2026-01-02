
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getAll, toCsv } from './csv';
import * as diaperChangesData from '@/data/diaper-changes';
import * as eventsData from '@/data/events';
import * as feedingSessionsData from '@/data/feeding-sessions';
import * as growthMeasurementsData from '@/data/growth-measurments';
import * as medicationRegimensData from '@/data/medication-regimens';
import * as medicationsData from '@/data/medications';
import Papa from 'papaparse';

vi.mock('papaparse');

describe('Export CSV', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getAll', () => {
		it('should return all data from the data stores', () => {
			const diaperChanges = [{ id: '1' }];
			const events = [{ id: '1' }];
			const feedingSessions = [{ id: '1' }];
			const growthMeasurements = [{ id: '1' }];
			const medicationRegimens = [{ id: '1' }];
			const medications = [{ id: '1' }];

			vi.spyOn(diaperChangesData, 'diaperChanges', 'get').mockReturnValue(
				diaperChanges as any,
			);
			vi.spyOn(eventsData, 'events', 'get').mockReturnValue(events as any);
			vi.spyOn(
				feedingSessionsData,
				'feedingSessions',
				'get',
			).mockReturnValue(feedingSessions as any);
			vi.spyOn(
				growthMeasurementsData,
				'growthMeasurements',
				'get',
			).mockReturnValue(growthMeasurements as any);
			vi.spyOn(
				medicationRegimensData,
				'medicationRegimensProxy',
				'get',
			).mockReturnValue(medicationRegimens as any);
			vi.spyOn(medicationsData, 'medicationsProxy', 'get').mockReturnValue(
				medications as any,
			);

			const allData = getAll();

			expect(allData).toHaveLength(6);
			expect(allData[0].name).toBe('diaperChanges');
			expect(allData[0].data).toEqual([{ id: '1' }]);
		});
	});

	describe('toCsv', () => {
		it('should convert data to a CSV string', () => {
			const data = [{ id: '1', name: 'test' }];
			(Papa.unparse as any).mockReturnValue('csv-string');

			const csv = toCsv('diaperChanges', data);

			expect(Papa.unparse).toHaveBeenCalledWith({
				fields: [
					'id',
					'timestamp',
					'containsUrine',
					'containsStool',
					'abnormalities',
					'diaperBrand',
					'leakage',
					'temperature',
				],
				data: [
					{
						id: '1',
						timestamp: undefined,
						containsUrine: undefined,
						containsStool: undefined,
						abnormalities: undefined,
						diaperBrand: undefined,
						leakage: undefined,
						temperature: undefined,
					},
				],
			});
			expect(csv).toBe('csv-string');
		});
	});
});
