import { Row } from 'tinybase';

/**
 * Converts a table to an array of entities, adding the ID.
 */
export function fromTable<T>(table: Record<string, Row>): T[] {
	return Object.entries(table).map(([id, row]) => ({ ...row, id }) as unknown as T);
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
