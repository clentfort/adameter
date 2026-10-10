import { beforeEach, describe, expect, it } from 'vitest';
import {
	BACKUP_INTERVAL_MS,
	isBackupDue,
	readBackupReminderState,
	recordBackup,
	writeBackupReminderState,
} from './backup-reminder';
import { setItem, STORAGE_KEYS } from './storage';

const NOW = new Date('2026-10-10T12:00:00Z');

describe('backup reminder', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it('asks by default and is due when no backup was ever made', () => {
		const state = readBackupReminderState();
		expect(state).toEqual({ mode: 'ask' });
		expect(isBackupDue(state, NOW)).toBe(true);
	});

	it('is not due within a week of the last backup', () => {
		const state = recordBackup(NOW);
		expect(
			isBackupDue(state, new Date(NOW.getTime() + BACKUP_INTERVAL_MS - 1)),
		).toBe(false);
		expect(
			isBackupDue(state, new Date(NOW.getTime() + BACKUP_INTERVAL_MS)),
		).toBe(true);
	});

	it('waits a week after the reminder was postponed', () => {
		const state = writeBackupReminderState({ lastPromptAt: NOW.getTime() });
		expect(isBackupDue(state, new Date(NOW.getTime() + 1000))).toBe(false);
	});

	it('is never due when switched off', () => {
		const state = writeBackupReminderState({ mode: 'off' });
		expect(isBackupDue(state, NOW)).toBe(false);
	});

	it('keeps other fields when updating', () => {
		writeBackupReminderState({ mode: 'auto' });
		recordBackup(NOW);
		expect(readBackupReminderState()).toEqual({
			lastBackupAt: NOW.getTime(),
			mode: 'auto',
		});
	});

	it('falls back to defaults for corrupt storage', () => {
		setItem(STORAGE_KEYS.BACKUP_REMINDER, '{not json');
		expect(readBackupReminderState()).toEqual({ mode: 'ask' });

		setItem(
			STORAGE_KEYS.BACKUP_REMINDER,
			JSON.stringify({ lastBackupAt: 'yesterday', mode: 'sometimes' }),
		);
		expect(readBackupReminderState()).toEqual({
			lastBackupAt: undefined,
			lastPromptAt: undefined,
			mode: 'ask',
		});
	});
});
