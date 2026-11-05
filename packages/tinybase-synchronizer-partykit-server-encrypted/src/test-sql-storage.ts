/// <reference types="node" />
import type { CellSqlStorage } from './cell-store';
import { DatabaseSync } from 'node:sqlite';

/**
 * An in-memory SQLite database with the subset of the Durable Object storage
 * API that the cell store uses. Test helper only.
 */
export function createTestSqlStorage() {
	const database = new DatabaseSync(':memory:');
	const sql: CellSqlStorage = {
		exec<Row>(query: string, ...bindings: unknown[]) {
			const statement = database.prepare(query);
			const rows = statement.all(
				...(bindings as (string | number | null)[]),
			) as Row[];
			return Object.assign(rows, { toArray: () => rows });
		},
	} as CellSqlStorage;
	const transactionSync = <Result>(closure: () => Result): Result => {
		database.exec('BEGIN');
		try {
			const result = closure();
			database.exec('COMMIT');
			return result;
		} catch (error) {
			database.exec('ROLLBACK');
			throw error;
		}
	};
	return { database, sql, transactionSync };
}
