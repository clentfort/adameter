import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMergeableStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { expect, test, vi } from 'vitest';
import { downloadBackup } from '@/lib/backup';
import { ExportDataCard } from './export-data-card';

vi.mock('@/lib/backup', () => ({
	downloadBackup: vi.fn(),
}));

test('calls onBackupRecorded with returned state when export succeeds', async () => {
	const user = userEvent.setup();
	const spy = vi.fn();
	const store = createMergeableStore();
	const mockBackupState = {
		lastBackupAt: 1_735_689_600_000,
		mode: 'ask' as const,
	};
	vi.mocked(downloadBackup).mockResolvedValue(mockBackupState);

	render(
		<Provider store={store}>
			<ExportDataCard onBackupRecorded={spy} />
		</Provider>,
	);

	const exportButton = screen.getByRole('button', { name: 'Export' });
	await user.click(exportButton);

	expect(downloadBackup).toHaveBeenCalledWith(store);
	expect(spy).toHaveBeenCalledWith(mockBackupState);
});
