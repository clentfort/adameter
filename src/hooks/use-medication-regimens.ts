import type { MedicationRegimen } from '@/types/medication-regimen';
import { useContext, useEffect, useMemo } from 'react';
import { useTable } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	getNextOrder,
	medicationRegimenFromRow,
	medicationRegimenToRow,
	tableToOrderedRows,
} from '@/lib/tinybase-sync/medication-table';

const defaultMedicationRegimens: MedicationRegimen[] = [
	{
		dosageAmount: 0.5,
		dosageUnit: 'ml',
		id: 'regimen-vitamind',
		name: 'Vitamin D drops',
		notes: 'Take with morning feeding.',
		prescriber: 'Self',
		schedule: { times: ['09:00'], type: 'daily' },
		startDate: '2025-06-01T00:00:00.000Z',
	},
	{
		dosageAmount: 250,
		dosageUnit: 'mg',
		endDate: '2025-07-05T00:00:00.000Z',
		id: 'regimen-antibiotic',
		name: 'Amoxicillin',
		notes: 'Complete the full 7-day course. Shake well before use.',
		prescriber: 'Doctor',
		prescriberName: 'Dr. Schmidt',
		schedule: {
			firstDoseTime: '08:00',
			intervalUnit: 'hours',
			intervalValue: 8,
			type: 'interval',
		},
		startDate: '2025-06-28T00:00:00.000Z',
	},
	{
		dosageAmount: 2.5,
		dosageUnit: 'ml',
		id: 'regimen-feverreducer',
		name: 'Paracetamol Syrup',
		notes: 'Max 4 doses in 24 hours.',
		prescriber: 'Doctor',
		prescriberName: 'Dr. Schmidt',
		schedule: { details: 'When fever > 38.5°C', type: 'asNeeded' },
		startDate: '2025-06-15T00:00:00.000Z',
	},
	{
		dosageAmount: 10,
		dosageUnit: 'mg',
		endDate: '2025-05-31T00:00:00.000Z',
		id: 'regimen-old-iron',
		isDiscontinued: true,
		name: 'Iron Supplement',
		notes: 'Discontinued after 1 month.',
		prescriber: 'Midwife',
		prescriberName: 'Maria Müller',
		schedule: { times: ['17:00'], type: 'daily' },
		startDate: '2025-05-01T00:00:00.000Z',
	},
];

export const useMedicationRegimens = () => {
	const { store } = useContext(tinybaseContext);
	const table = useTable(TABLE_IDS.MEDICATION_REGIMENS, store);

	const value = useMemo(
		() =>
			tableToOrderedRows<MedicationRegimen>(table, medicationRegimenFromRow),
		[table],
	);

	const add = (item: MedicationRegimen) => {
		store.setRow(
			TABLE_IDS.MEDICATION_REGIMENS,
			item.id,
			medicationRegimenToRow(item, getNextOrder(table)),
		);
	};

	const remove = (id: string) => {
		store.delRow(TABLE_IDS.MEDICATION_REGIMENS, id);
	};

	const update = (item: MedicationRegimen) => {
		const existingOrder = table[item.id]?.order;
		const order =
			typeof existingOrder === 'number' ? existingOrder : getNextOrder(table);
		store.setRow(
			TABLE_IDS.MEDICATION_REGIMENS,
			item.id,
			medicationRegimenToRow(item, order),
		);
	};

	const replace = (next: MedicationRegimen[]) => {
		const nextTable = Object.fromEntries(
			next.map((item, order) => [item.id, medicationRegimenToRow(item, order)]),
		);
		store.setTable(TABLE_IDS.MEDICATION_REGIMENS, nextTable);
	};

	useEffect(() => {
		if (value.length === 0 && defaultMedicationRegimens.length > 0) {
			replace(defaultMedicationRegimens);
		}
	}, [value]);

	return { add, remove, replace, update, value } as const;
};
