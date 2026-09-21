import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMergeableStore } from 'tinybase';
import { describe, expect, it, vi } from 'vitest';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { exportStoreAsZip } from '@/utils/data-transfer/export';
import { extractFiles } from '@/utils/data-transfer/zip';
import DataSettingsPage from './page';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/utils/data-transfer/export', () => ({
	exportStoreAsZip: vi.fn(),
}));

vi.mock('@/utils/data-transfer/zip', () => ({
	extractFiles: vi.fn(),
}));

describe('DataSettingsPage', () => {
	it('renders export, import, and factory reset cards', () => {
		const store = createMergeableStore();
		render(
			<tinybaseContext.Provider value={{ store }}>
				<DataSettingsPage />
			</tinybaseContext.Provider>,
		);

		expect(screen.getByText('Export Data')).toBeInTheDocument();
		expect(screen.getByText('Import Data')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: 'Factory Reset' }),
		).toBeInTheDocument();
	});

	it('triggers data export when Export button is clicked', async () => {
		vi.mocked(exportStoreAsZip).mockResolvedValueOnce();

		const store = createMergeableStore();
		store.setTable(TABLE_IDS.DIAPER_CHANGES, {
			change1: {
				containsStool: true,
				containsUrine: false,
				locationLatitude: 37.7749,
				locationLongitude: -122.4194,
				timestamp: '2026-03-03T08:00:00Z',
			},
		});

		render(
			<tinybaseContext.Provider value={{ store }}>
				<DataSettingsPage />
			</tinybaseContext.Provider>,
		);

		const exportButton = screen.getByRole('button', { name: 'Export' });
		fireEvent.click(exportButton);

		await waitFor(() => {
			expect(exportStoreAsZip).toHaveBeenCalledWith(store);
		});
	});

	it('imports entity rows from extracted ZIP files including location coordinates', async () => {
		const store = createMergeableStore();

		vi.mocked(extractFiles).mockResolvedValueOnce([
			{
				content:
					'id,containsStool,containsUrine,timestamp,locationLatitude,locationLongitude\nchange-101,true,true,2026-03-03T08:00:00Z,52.52,13.405',
				name: TABLE_IDS.DIAPER_CHANGES,
			},
			{
				content:
					'id,breast,durationInSeconds,startTime,endTime,locationLatitude,locationLongitude\nfeeding-202,left,300,2026-03-03T09:00:00Z,2026-03-03T09:05:00Z,48.8566,2.3522',
				name: TABLE_IDS.FEEDING_SESSIONS,
			},
		]);

		const { container } = render(
			<tinybaseContext.Provider value={{ store }}>
				<DataSettingsPage />
			</tinybaseContext.Provider>,
		);

		const fileInput = container.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		const mockFile = new File(['mock zip'], 'backup.zip', {
			type: 'application/zip',
		});

		fireEvent.change(fileInput, { target: { files: [mockFile] } });

		await waitFor(() => {
			expect(extractFiles).toHaveBeenCalledWith(mockFile);
		});

		const importedDiaperRow = store.getRow(
			TABLE_IDS.DIAPER_CHANGES,
			'change-101',
		);
		expect(importedDiaperRow).toBeDefined();
		expect(importedDiaperRow.locationLatitude).toBe(52.52);
		expect(importedDiaperRow.locationLongitude).toBe(13.405);

		const importedFeedingRow = store.getRow(
			TABLE_IDS.FEEDING_SESSIONS,
			'feeding-202',
		);
		expect(importedFeedingRow).toBeDefined();
		expect(importedFeedingRow.locationLatitude).toBe(48.8566);
		expect(importedFeedingRow.locationLongitude).toBe(2.3522);
	});
});
