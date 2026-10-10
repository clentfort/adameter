import type { MergeableStore } from 'tinybase';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMergeableStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tinybaseContext } from '@/contexts/tinybase-context';
import {
	readBackupReminderState,
	writeBackupReminderState,
} from '@/lib/backup-reminder';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { BackupReminder } from './backup-reminder';

const mocks = vi.hoisted(() => ({
	exportStoreAsZip: vi.fn<() => Promise<void>>(),
	toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

vi.mock('@/utils/data-transfer/export', () => ({
	exportStoreAsZip: mocks.exportStoreAsZip,
}));

vi.mock('@/components/ui/use-toast', () => ({
	useToast: () => ({ toast: mocks.toast }),
}));

function createStoreWithData() {
	const store = createMergeableStore();
	store.setRow(TABLE_IDS.EVENTS, 'event-1', { title: 'Event' });
	return store;
}

function renderReminder(store: MergeableStore = createStoreWithData()) {
	return render(
		<tinybaseContext.Provider value={{ store }}>
			<BackupReminder />
		</tinybaseContext.Provider>,
	);
}

describe('BackupReminder', () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.clearAllMocks();
		mocks.exportStoreAsZip.mockResolvedValue();
	});

	it('asks for a backup when none was made yet', async () => {
		renderReminder();
		expect(await screen.findByText('Back up your data')).toBeInTheDocument();
	});

	it('stays hidden when there is nothing to back up', () => {
		renderReminder(createMergeableStore());
		expect(screen.queryByText('Back up your data')).not.toBeInTheDocument();
	});

	it('stays hidden when only profiles exist', () => {
		const store = createMergeableStore();
		store.setRow(TABLE_IDS.PROFILES, 'profile-1', { name: 'Ada' });
		renderReminder(store);
		expect(screen.queryByText('Back up your data')).not.toBeInTheDocument();
	});

	it('stays hidden within a week of the last backup', () => {
		writeBackupReminderState({ lastBackupAt: Date.now() });
		renderReminder();
		expect(screen.queryByText('Back up your data')).not.toBeInTheDocument();
	});

	it('downloads a backup and records it', async () => {
		renderReminder();
		await userEvent.click(
			await screen.findByTestId('backup-reminder-download'),
		);

		expect(mocks.exportStoreAsZip).toHaveBeenCalledTimes(1);
		await waitFor(() => {
			expect(readBackupReminderState().lastBackupAt).toBeDefined();
		});
		expect(readBackupReminderState().mode).toBe('ask');
	});

	it('switches to automatic backups when requested', async () => {
		renderReminder();
		await userEvent.click(
			await screen.findByRole('checkbox', {
				name: 'Download automatically every week',
			}),
		);
		await userEvent.click(screen.getByTestId('backup-reminder-download'));

		await waitFor(() => {
			expect(readBackupReminderState().mode).toBe('auto');
		});
	});

	it('postpones the reminder by a week', async () => {
		renderReminder();
		await userEvent.click(
			await screen.findByTestId('backup-reminder-postpone'),
		);

		expect(readBackupReminderState().lastPromptAt).toBeDefined();
		expect(mocks.exportStoreAsZip).not.toHaveBeenCalled();
	});

	it('can be switched off', async () => {
		renderReminder();
		await userEvent.click(await screen.findByTestId('backup-reminder-opt-out'));

		expect(readBackupReminderState().mode).toBe('off');
	});

	it('downloads without asking in automatic mode', async () => {
		writeBackupReminderState({ mode: 'auto' });
		renderReminder();

		await waitFor(() => {
			expect(mocks.exportStoreAsZip).toHaveBeenCalledTimes(1);
		});
		expect(screen.queryByText('Back up your data')).not.toBeInTheDocument();
		await waitFor(() => {
			expect(mocks.toast.success).toHaveBeenCalled();
		});
	});

	it('falls back to asking when the automatic download fails', async () => {
		writeBackupReminderState({ mode: 'auto' });
		mocks.exportStoreAsZip.mockRejectedValue(new Error('blocked'));
		renderReminder();

		expect(await screen.findByText('Back up your data')).toBeInTheDocument();
	});
});
