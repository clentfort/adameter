/** `t` for table cells, `v` for values. */
export type CellKind = 't' | 'v';

/** A cell or value with its HLC and ciphertext, as sent by clients. */
export interface CellRecord {
	cell: string;
	data: string;
	hlc: string;
	kind: CellKind;
	row: string;
	table: string;
}

export interface StoredCell extends CellRecord {
	seq: number;
}

export type CellAddress = Pick<CellRecord, 'cell' | 'kind' | 'row' | 'table'>;

/** The subset of Durable Object SQL storage used by {@link CellStore}. */
export interface CellSqlStorage {
	exec<Row extends Record<string, SqlStorageValue>>(
		query: string,
		...bindings: unknown[]
	): { toArray(): Row[] };
}

export const MAX_BATCH_CELLS = 500;
export const MAX_BATCH_BYTES = 512 * 1024;
export const MAX_CELL_BYTES = 64 * 1024;
export const MAX_PAGE_CELLS = 1000;
/** HLCs further ahead of the server clock are rejected. */
export const MAX_HLC_FUTURE_OFFSET_MS = 5 * 60 * 1000;

const HLC_PATTERN = /^[\w-]{16}$/;
const HLC_ALPHABET =
	'-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
const HEAD_SEQ_KEY = 'head_seq';
const MAX_ID_LENGTH = 256;

/** Decodes the wall-clock milliseconds of a TinyBase HLC. */
export function getHlcTime(hlc: string): number {
	let time = 0;
	for (let index = 0; index < 7; index += 1) {
		time = time * 64 + HLC_ALPHABET.indexOf(hlc[index]);
	}
	return time;
}

export class CellValidationError extends Error {
	readonly status: number;

	constructor(message: string, status = 400) {
		super(message);
		this.name = 'CellValidationError';
		this.status = status;
	}
}

function isId(candidate: unknown): candidate is string {
	return typeof candidate === 'string' && candidate.length <= MAX_ID_LENGTH;
}

/** Validates a parsed POST body. Throws {@link CellValidationError}. */
export function parseCellBatch(body: unknown): CellRecord[] {
	if (!Array.isArray(body)) {
		throw new CellValidationError('Expected an array of cells');
	}
	if (body.length > MAX_BATCH_CELLS) {
		throw new CellValidationError('Too many cells', 413);
	}
	return body.map((candidate: unknown): CellRecord => {
		if (candidate === null || typeof candidate !== 'object') {
			throw new CellValidationError('Invalid cell');
		}
		const { cell, data, hlc, kind, row, table } = candidate as Record<
			string,
			unknown
		>;
		if (
			(kind !== 't' && kind !== 'v') ||
			!isId(table) ||
			!isId(row) ||
			!isId(cell) ||
			typeof hlc !== 'string' ||
			!HLC_PATTERN.test(hlc) ||
			typeof data !== 'string'
		) {
			throw new CellValidationError('Invalid cell');
		}
		if (kind === 'v' && (table !== '' || row !== '')) {
			throw new CellValidationError('Invalid value');
		}
		if (data.length > MAX_CELL_BYTES) {
			throw new CellValidationError('Cell too large', 413);
		}
		return { cell, data, hlc, kind, row, table };
	});
}

/**
 * Stores one encrypted value per cell and merges uploads per cell: the larger
 * HLC wins, as in a TinyBase MergeableStore. Every accepted write gets a new,
 * increasing sequence number so clients can fetch what changed since a point.
 */
export class CellStore {
	private initialized = false;

	constructor(
		private readonly sql: CellSqlStorage,
		private readonly transactionSync: <Result>(closure: () => Result) => Result,
	) {}

	private init() {
		if (this.initialized) return;
		this.sql.exec(`CREATE TABLE IF NOT EXISTS cells (
			kind TEXT NOT NULL,
			table_id TEXT NOT NULL,
			row_id TEXT NOT NULL,
			cell_id TEXT NOT NULL,
			hlc TEXT NOT NULL,
			data TEXT NOT NULL,
			seq INTEGER NOT NULL,
			PRIMARY KEY (kind, table_id, row_id, cell_id)
		)`);
		this.sql.exec('CREATE INDEX IF NOT EXISTS cells_seq ON cells (seq)');
		this.sql.exec(
			'CREATE TABLE IF NOT EXISTS cell_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
		);
		this.initialized = true;
	}

	getHead(): number {
		this.init();
		const [row] = this.sql
			.exec<{ value: string }>(
				'SELECT value FROM cell_meta WHERE key = ?',
				HEAD_SEQ_KEY,
			)
			.toArray();
		return row ? Number(row.value) : 0;
	}

	/** Returns the cells whose HLC is too far ahead of `now`. */
	getFutureCells(cells: readonly CellRecord[], now: number): CellAddress[] {
		return cells
			.filter((cell) => getHlcTime(cell.hlc) > now + MAX_HLC_FUTURE_OFFSET_MS)
			.map(({ cell, kind, row, table }) => ({ cell, kind, row, table }));
	}

	/**
	 * Writes the cells that are newer than the stored ones. Equal or older HLCs
	 * are ignored without a write. Returns the accepted cells in sequence order.
	 */
	put(cells: readonly CellRecord[]): { accepted: StoredCell[]; head: number } {
		this.init();
		return this.transactionSync(() => {
			let head = this.getHead();
			const accepted: StoredCell[] = [];
			for (const cell of cells) {
				const [stored] = this.sql
					.exec<{ hlc: string }>(
						'SELECT hlc FROM cells WHERE kind = ? AND table_id = ? AND row_id = ? AND cell_id = ?',
						cell.kind,
						cell.table,
						cell.row,
						cell.cell,
					)
					.toArray();
				if (stored && cell.hlc <= stored.hlc) continue;

				head += 1;
				this.sql.exec(
					`INSERT INTO cells (kind, table_id, row_id, cell_id, hlc, data, seq)
					VALUES (?, ?, ?, ?, ?, ?, ?)
					ON CONFLICT (kind, table_id, row_id, cell_id)
					DO UPDATE SET hlc = excluded.hlc, data = excluded.data, seq = excluded.seq`,
					cell.kind,
					cell.table,
					cell.row,
					cell.cell,
					cell.hlc,
					cell.data,
					head,
				);
				accepted.push({ ...cell, seq: head });
			}
			if (accepted.length > 0) {
				this.sql.exec(
					'INSERT INTO cell_meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
					HEAD_SEQ_KEY,
					String(head),
				);
			}
			return { accepted, head };
		});
	}

	/** Lists cells with a sequence number above `since`, in sequence order. */
	list(since: number, limit: number): { cells: StoredCell[]; head: number } {
		this.init();
		const rows = this.sql
			.exec<{
				cell_id: string;
				data: string;
				hlc: string;
				kind: string;
				row_id: string;
				seq: number;
				table_id: string;
			}>(
				'SELECT kind, table_id, row_id, cell_id, hlc, data, seq FROM cells WHERE seq > ? ORDER BY seq LIMIT ?',
				since,
				Math.max(1, Math.min(limit, MAX_PAGE_CELLS)),
			)
			.toArray();
		return {
			cells: rows.map((row) => ({
				cell: row.cell_id,
				data: row.data,
				hlc: row.hlc,
				kind: row.kind as CellKind,
				row: row.row_id,
				seq: Number(row.seq),
				table: row.table_id,
			})),
			head: this.getHead(),
		};
	}
}
