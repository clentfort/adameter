import { describe, expect, it } from 'vitest';
import { ROW_JSON_CELL, ROW_ORDER_CELL } from './constants';
import {
	medicationAdministrationFromRow,
	medicationAdministrationToRow,
	medicationRegimenFromRow,
	medicationRegimenToRow,
} from './medication-table';

describe('medication-table', () => {
	it('roundtrips medication administration with typed cells', () => {
		const administration = {
			administrationStatus: 'On Time' as const,
			details: 'with food',
			dosageAmount: 2.5,
			dosageUnit: 'ml',
			id: 'admin-1',
			medicationName: 'Paracetamol',
			regimenId: 'reg-1',
			timestamp: '2026-02-07T10:00:00.000Z',
		};

		const row = medicationAdministrationToRow(administration, 3);
		expect(row[ROW_ORDER_CELL]).toBe(3);

		const parsed = medicationAdministrationFromRow('admin-1', row);
		expect(parsed).toEqual(administration);
	});

	it('roundtrips medication regimen with schedule json cell', () => {
		const regimen = {
			dosageAmount: 1,
			dosageUnit: 'ml',
			id: 'reg-1',
			name: 'Vitamin D',
			notes: 'daily',
			prescriber: 'Doctor' as const,
			prescriberName: 'Dr. Smith',
			schedule: {
				times: ['09:00'],
				type: 'daily' as const,
			},
			startDate: '2026-02-01T00:00:00.000Z',
		};

		const row = medicationRegimenToRow(regimen, 0);
		expect(row[ROW_ORDER_CELL]).toBe(0);

		const parsed = medicationRegimenFromRow('reg-1', row);
		expect(parsed).toEqual(regimen);
	});

	it('falls back to legacy json rows for compatibility', () => {
		const legacyAdministration = {
			administrationStatus: 'Missed' as const,
			dosageAmount: 1,
			dosageUnit: 'ml',
			id: 'admin-legacy',
			medicationName: 'Vitamin D',
			timestamp: '2026-02-07T11:00:00.000Z',
		};

		const parsed = medicationAdministrationFromRow('admin-legacy', {
			[ROW_JSON_CELL]: JSON.stringify(legacyAdministration),
			[ROW_ORDER_CELL]: 0,
		});

		expect(parsed).toEqual(legacyAdministration);
	});
});
