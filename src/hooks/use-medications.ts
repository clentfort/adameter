import type { MedicationAdministration } from '@/types/medication';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTable } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	getNextOrder,
	medicationAdministrationFromRow,
	medicationAdministrationToRow,
	tableToOrderedRows,
} from '@/lib/tinybase-sync/medication-table';

const defaultMedications: MedicationAdministration[] = [
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		dosageUnit: 'ml',
		id: 'med-admin-1',
		medicationName: 'Vitamin D drops',
		regimenId: 'regimen-vitamind',
		timestamp: '2025-07-01T09:05:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		dosageUnit: 'ml',
		id: 'med-admin-2',
		medicationName: 'Vitamin D drops',
		regimenId: 'regimen-vitamind',
		timestamp: '2025-07-02T09:03:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 250,
		dosageUnit: 'mg',
		id: 'med-admin-3',
		medicationName: 'Amoxicillin',
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-07-01T08:15:00.000Z',
	},
	{
		administrationStatus: 'Adjusted',
		details: 'Given 30 min late due to nap',
		dosageAmount: 250,
		dosageUnit: 'mg',
		id: 'med-admin-4',
		medicationName: 'Amoxicillin',
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-07-01T16:30:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		details: 'Fever 39.2C',
		dosageAmount: 2.5,
		dosageUnit: 'ml',
		id: 'med-admin-5',
		medicationName: 'Paracetamol Syrup',
		regimenId: 'regimen-feverreducer',
		timestamp: '2025-07-01T21:00:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		dosageUnit: 'ml',
		id: 'med-admin-6',
		medicationName: 'Vitamin D drops',
		regimenId: 'regimen-vitamind',
		timestamp: '2025-06-30T09:00:00.000Z',
	},
	{
		administrationStatus: 'Missed',
		details: 'Forgot overnight dose',
		dosageAmount: 250,
		dosageUnit: 'mg',
		id: 'med-admin-7',
		medicationName: 'Amoxicillin',
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-06-30T00:00:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 10,
		dosageUnit: 'mg',
		id: 'med-admin-8',
		medicationName: 'Iron Supplement',
		regimenId: 'regimen-old-iron',
		timestamp: '2025-05-29T17:00:00.000Z',
	},
];

export const useMedications = () => {
	const { store } = useContext(tinybaseContext);
	const table = useTable(TABLE_IDS.MEDICATIONS, store);

	const value = useMemo(
		() =>
			tableToOrderedRows<MedicationAdministration>(
				table,
				medicationAdministrationFromRow,
			),
		[table],
	);

	const add = (item: MedicationAdministration) => {
		store.setRow(
			TABLE_IDS.MEDICATIONS,
			item.id,
			medicationAdministrationToRow(item, getNextOrder(table)),
		);
	};

	const remove = (id: string) => {
		store.delRow(TABLE_IDS.MEDICATIONS, id);
	};

	const update = (item: MedicationAdministration) => {
		const existingOrder = table[item.id]?.order;
		const order =
			typeof existingOrder === 'number' ? existingOrder : getNextOrder(table);
		store.setRow(
			TABLE_IDS.MEDICATIONS,
			item.id,
			medicationAdministrationToRow(item, order),
		);
	};

	const replace = useCallback(
		(next: MedicationAdministration[]) => {
			const nextTable = Object.fromEntries(
				next.map((item, order) => [
					item.id,
					medicationAdministrationToRow(item, order),
				]),
			);
			store.setTable(TABLE_IDS.MEDICATIONS, nextTable);
		},
		[store],
	);

	useEffect(() => {
		if (value.length === 0 && defaultMedications.length > 0) {
			replace(defaultMedications);
		}
	}, [replace, value]);

	return { add, remove, replace, update, value } as const;
};
