import { Row } from 'tinybase';

/**
 * Strips any metadata cells from a row and adds the ID.
 */
export function fromRow<T>(id: string, row: Row): T {
	return { ...row, id } as unknown as T;
}

/**
 * Converts a table to an array of entities, stripping the 'json' cell.
 */
export function fromTable<T>(table: Record<string, Row>): T[] {
	return Object.entries(table).map(([id, row]) => fromRow<T>(id, row));
}

/**
 * Prepares an entity to be stored as cells, stripping 'id' and non-primitives.
 */
export function toRow(
	item: Record<string, unknown>,
): Record<string, string | number | boolean> {
	const { id: _, ...rest } = item;
	const result: Record<string, string | number | boolean> = {};

	for (const [key, value] of Object.entries(rest)) {
		if (
			typeof value === 'string' ||
			typeof value === 'number' ||
			typeof value === 'boolean'
		) {
			result[key] = value;
		}
	}

	return result;
}
