import { createStore } from 'tinybase';
import { describe, expect, it, vi } from 'vitest';
import { exportStoreAsZip } from './export';
import { createZip, downloadZip } from './zip';

vi.mock('./zip', () => ({
	createZip: vi
		.fn()
		.mockResolvedValue(
			new Blob(['mock zip content'], { type: 'application/zip' }),
		),
	downloadZip: vi.fn(),
}));

describe('exportStoreAsZip', () => {
	it('should export store tables and values as CSV in a ZIP file', async () => {
		const store = createStore();
		store.setTable('t1', { r1: { c1: 'v1' } });
		store.setValues({ v1: 'val1', v2: 2 });

		await exportStoreAsZip(store);

		expect(createZip).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					name: 't1.csv',
				}),
				expect.objectContaining({
					name: '__values.csv',
				}),
			]),
		);
		expect(downloadZip).toHaveBeenCalled();
	});

	it('should not include __values.csv if there are no values', async () => {
		vi.clearAllMocks();
		const store = createStore();
		store.setTable('t1', { r1: { c1: 'v1' } });

		await exportStoreAsZip(store);

		const files = vi.mocked(createZip).mock.calls[0][0];
		expect(files.find((f) => f.name === '__values.csv')).toBeUndefined();
		expect(files.find((f) => f.name === 't1.csv')).toBeDefined();
	});
});
