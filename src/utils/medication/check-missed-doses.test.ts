import { describe, expect, it, vi } from 'vitest';
import { MedicationAdministration, MedicationRegimen } from '@/types/medication';
import { checkMissedDoses } from './check-missed-doses';

vi.mock('../device-id', () => ({
	getDeviceId: () => 'test-device',
}));

describe('checkMissedDoses', () => {
	it('should return skipped doses for missed fixed times', () => {
		const regimen: MedicationRegimen = {
			dosage: '1',
			id: 'reg1',
			name: 'Med 1',
			startDate: '2023-01-01T00:00:00Z',
			status: 'active',
			times: ['08:00', '12:00', '16:00'],
			type: 'fixed',
			unit: 'pill',
		};

		const lastAdmin: MedicationAdministration = {
			dosage: '1',
			id: 'admin1',
			name: 'Med 1',
			regimenId: 'reg1',
			status: 'administered',
			timestamp: '2023-01-02T07:00:00Z',
			unit: 'pill',
		};

		// Current time is 17:00. Missed 08:00, 12:00, 16:00.
		// 08:00 and 12:00 should be marked as skipped.
		// 16:00 remains as active overdue reminder.
		vi.setSystemTime(new Date('2023-01-02T17:00:00Z'));

		const newSkips = checkMissedDoses([regimen], [lastAdmin]);

		expect(newSkips).toHaveLength(2);
		expect(newSkips[0].timestamp).toContain('08:00');
		expect(newSkips[0].status).toBe('skipped');
		expect(newSkips[1].timestamp).toContain('12:00');
		expect(newSkips[1].status).toBe('skipped');
	});

	it('should not return already recorded skipped doses', () => {
		const regimen: MedicationRegimen = {
			dosage: '1',
			id: 'reg1',
			name: 'Med 1',
			startDate: '2023-01-01T00:00:00Z',
			status: 'active',
			times: ['08:00', '12:00', '16:00'],
			type: 'fixed',
			unit: 'pill',
		};

		const lastAdmin: MedicationAdministration = {
			dosage: '1',
			id: 'admin1',
			name: 'Med 1',
			status: 'administered',
			timestamp: '2023-01-02T07:00:00Z',
			unit: 'pill',
		};

		const alreadySkipped: MedicationAdministration = {
			dosage: '1',
			id: 'skip1',
			name: 'Med 1',
			regimenId: 'reg1',
			status: 'skipped',
			timestamp: new Date('2023-01-02T08:00:00Z').toISOString(),
			unit: 'pill',
		};

		vi.setSystemTime(new Date('2023-01-02T17:00:00Z'));

		const newSkips = checkMissedDoses([regimen], [lastAdmin, alreadySkipped]);

		expect(newSkips).toHaveLength(1);
		expect(newSkips[0].timestamp).toContain('12:00');
	});
});
