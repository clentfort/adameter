import type { Row, Table } from 'tinybase';
import type { MedicationAdministration } from '@/types/medication';
import type { MedicationRegimen } from '@/types/medication-regimen';
import { ROW_JSON_CELL, ROW_ORDER_CELL } from '@/lib/tinybase-sync/constants';

const CELL_ADMINISTRATION_STATUS = 'administrationStatus';
const CELL_DETAILS = 'details';
const CELL_DOSAGE_AMOUNT = 'dosageAmount';
const CELL_DOSAGE_UNIT = 'dosageUnit';
const CELL_END_DATE = 'endDate';
const CELL_IS_DISCONTINUED = 'isDiscontinued';
const CELL_MEDICATION_NAME = 'medicationName';
const CELL_NOTES = 'notes';
const CELL_PRESCRIBER = 'prescriber';
const CELL_PRESCRIBER_NAME = 'prescriberName';
const CELL_REGIMEN_ID = 'regimenId';
const CELL_SCHEDULE = 'schedule';
const CELL_START_DATE = 'startDate';
const CELL_TIMESTAMP = 'timestamp';

export function medicationAdministrationToRow(
	item: MedicationAdministration,
	order: number,
): Row {
	return {
		[CELL_ADMINISTRATION_STATUS]: item.administrationStatus,
		[CELL_DETAILS]: item.details ?? null,
		[CELL_DOSAGE_AMOUNT]: item.dosageAmount,
		[CELL_DOSAGE_UNIT]: item.dosageUnit,
		[CELL_MEDICATION_NAME]: item.medicationName,
		[CELL_REGIMEN_ID]: item.regimenId ?? null,
		[CELL_TIMESTAMP]: item.timestamp,
		[ROW_ORDER_CELL]: order,
	};
}

export function medicationAdministrationFromRow(
	rowId: string,
	row: Row,
): MedicationAdministration | undefined {
	const administrationStatus = row[CELL_ADMINISTRATION_STATUS];
	const dosageAmount = row[CELL_DOSAGE_AMOUNT];
	const dosageUnit = row[CELL_DOSAGE_UNIT];
	const medicationName = row[CELL_MEDICATION_NAME];
	const timestamp = row[CELL_TIMESTAMP];

	if (
		(administrationStatus !== 'On Time' &&
			administrationStatus !== 'Missed' &&
			administrationStatus !== 'Adjusted') ||
		typeof dosageAmount !== 'number' ||
		typeof dosageUnit !== 'string' ||
		typeof medicationName !== 'string' ||
		typeof timestamp !== 'string'
	) {
		return parseLegacyJsonRow<MedicationAdministration>(row, rowId);
	}

	const details = row[CELL_DETAILS];
	const regimenId = row[CELL_REGIMEN_ID];

	return {
		administrationStatus,
		...(typeof details === 'string' ? { details } : {}),
		dosageAmount,
		dosageUnit,
		id: rowId,
		medicationName,
		...(typeof regimenId === 'string' ? { regimenId } : {}),
		timestamp,
	};
}

export function medicationRegimenToRow(
	item: MedicationRegimen,
	order: number,
): Row {
	return {
		[CELL_DOSAGE_AMOUNT]: item.dosageAmount,
		[CELL_DOSAGE_UNIT]: item.dosageUnit,
		[CELL_END_DATE]: item.endDate ?? null,
		[CELL_IS_DISCONTINUED]: item.isDiscontinued ?? null,
		[CELL_MEDICATION_NAME]: item.name,
		[CELL_NOTES]: item.notes ?? null,
		[CELL_PRESCRIBER]: item.prescriber,
		[CELL_PRESCRIBER_NAME]: item.prescriberName ?? null,
		[CELL_SCHEDULE]: JSON.stringify(item.schedule),
		[CELL_START_DATE]: item.startDate,
		[ROW_ORDER_CELL]: order,
	};
}

export function medicationRegimenFromRow(
	rowId: string,
	row: Row,
): MedicationRegimen | undefined {
	const dosageAmount = row[CELL_DOSAGE_AMOUNT];
	const dosageUnit = row[CELL_DOSAGE_UNIT];
	const name = row[CELL_MEDICATION_NAME];
	const prescriber = row[CELL_PRESCRIBER];
	const schedule = row[CELL_SCHEDULE];
	const startDate = row[CELL_START_DATE];

	if (
		typeof dosageAmount !== 'number' ||
		typeof dosageUnit !== 'string' ||
		typeof name !== 'string' ||
		(prescriber !== 'Self' &&
			prescriber !== 'Midwife' &&
			prescriber !== 'Doctor') ||
		typeof schedule !== 'string' ||
		typeof startDate !== 'string'
	) {
		return parseLegacyJsonRow<MedicationRegimen>(row, rowId);
	}

	const parsedSchedule = safeParse<MedicationRegimen['schedule']>(schedule);
	if (!parsedSchedule || typeof parsedSchedule !== 'object') {
		return parseLegacyJsonRow<MedicationRegimen>(row, rowId);
	}

	const endDate = row[CELL_END_DATE];
	const isDiscontinued = row[CELL_IS_DISCONTINUED];
	const notes = row[CELL_NOTES];
	const prescriberName = row[CELL_PRESCRIBER_NAME];

	return {
		dosageAmount,
		dosageUnit,
		...(typeof endDate === 'string' ? { endDate } : {}),
		id: rowId,
		...(typeof isDiscontinued === 'boolean' ? { isDiscontinued } : {}),
		name,
		...(typeof notes === 'string' ? { notes } : {}),
		prescriber,
		...(typeof prescriberName === 'string' ? { prescriberName } : {}),
		schedule: parsedSchedule,
		startDate,
	};
}

export function tableToOrderedRows<S>(
	table: Table,
	mapper: (rowId: string, row: Row) => S | undefined,
) {
	const entries: { item: S; order: number; rowId: string }[] = [];

	for (const [rowId, rowValue] of Object.entries(table)) {
		const row = rowValue as Row;
		const item = mapper(rowId, row);
		if (!item) {
			continue;
		}

		const order = row[ROW_ORDER_CELL];
		entries.push({
			item,
			order: typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER,
			rowId,
		});
	}

	entries.sort((left, right) => {
		if (left.order !== right.order) {
			return left.order - right.order;
		}
		return left.rowId.localeCompare(right.rowId);
	});

	return entries.map((entry) => entry.item);
}

export function getNextOrder(table: Table) {
	let maxOrder = -1;
	for (const row of Object.values(table)) {
		const order = row[ROW_ORDER_CELL];
		if (typeof order === 'number' && order > maxOrder) {
			maxOrder = order;
		}
	}

	return maxOrder + 1;
}

function parseLegacyJsonRow<T extends { id: string }>(
	row: Row,
	rowId: string,
): T | undefined {
	const json = row[ROW_JSON_CELL];
	if (typeof json !== 'string') {
		return undefined;
	}

	const parsed = safeParse<T>(json);
	if (!parsed || typeof parsed.id !== 'string') {
		return undefined;
	}

	if (parsed.id !== rowId) {
		return {
			...parsed,
			id: rowId,
		};
	}

	return parsed;
}

function safeParse<T>(value: string): T | undefined {
	try {
		return JSON.parse(value) as T;
	} catch {
		return undefined;
	}
}
