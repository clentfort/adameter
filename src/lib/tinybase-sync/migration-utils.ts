import { Row } from 'tinybase';
import { ROW_JSON_CELL } from './constants';

/**
 * Strips the 'json' cell from a row and adds the ID.
 */
export function fromRow<T>(id: string, row: Row): T {
	const { [ROW_JSON_CELL]: json, ...cells } = row;

	// Fallback to JSON if cells are missing (only ID and deviceId/order present)
	// or if we have very few cells, indicating migration might not have happened.
	const cellCount = Object.keys(cells).length;
	if (typeof json === 'string' && cellCount <= 2) {
		try {
			const data = JSON.parse(json);
			if (data && typeof data === 'object') {
				return { ...data, ...cells, id } as unknown as T;
			}
		} catch {
			// Ignore malformed JSON
		}
	}

	return { ...cells, id } as unknown as T;
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
