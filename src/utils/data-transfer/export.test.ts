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

		const exportDate = new Date(2026, 2, 30, 14, 15, 9);
		await exportStoreAsZip(store, exportDate);

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
		expect(downloadZip).toHaveBeenCalledWith(expect.any(Blob), exportDate);
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

	it('should include location coordinates in the exported CSV for entities with location data', async () => {
		vi.clearAllMocks();
		const store = createStore();
		store.setTable('diaper_changes', {
			change1: {
				containsStool: true,
				containsUrine: false,
				locationLatitude: 37.7749,
				locationLongitude: -122.4194,
				timestamp: '2026-03-03T08:00:00Z',
			},
		});

		await exportStoreAsZip(store);

		const files = vi.mocked(createZip).mock.calls[0][0];
		const diaperFile = files.find((f) => f.name === 'diaper_changes.csv');
		expect(diaperFile).toBeDefined();
		expect(diaperFile?.content).toContain('locationLatitude');
		expect(diaperFile?.content).toContain('locationLongitude');
		expect(diaperFile?.content).toContain('37.7749');
		expect(diaperFile?.content).toContain('-122.4194');
	});
});
