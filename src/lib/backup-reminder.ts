import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

export type BackupReminderMode = 'ask' | 'auto' | 'off';

export interface BackupReminderState {
	lastBackupAt?: number;
	lastPromptAt?: number;
	mode: BackupReminderMode;
}

export const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// Until then the reminder also explains the sync server move.
export const SYNC_SERVER_MOVE_NOTICE_UNTIL = new Date('2026-12-01T00:00:00Z');

const DEFAULT_STATE: BackupReminderState = { mode: 'ask' };

export function isBackupReminderMode(
	value: unknown,
): value is BackupReminderMode {
	return value === 'ask' || value === 'auto' || value === 'off';
}

function toTimestamp(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value)
		? value
		: undefined;
}

export function readBackupReminderState(): BackupReminderState {
	const raw = getItem(STORAGE_KEYS.BACKUP_REMINDER);
	if (!raw) {
		return DEFAULT_STATE;
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) {
			return DEFAULT_STATE;
		}
		const candidate = parsed as Record<string, unknown>;
		return {
			lastBackupAt: toTimestamp(candidate.lastBackupAt),
			lastPromptAt: toTimestamp(candidate.lastPromptAt),
			mode: isBackupReminderMode(candidate.mode) ? candidate.mode : 'ask',
		};
	} catch {
		return DEFAULT_STATE;
	}
}

export function writeBackupReminderState(
	update: Partial<BackupReminderState>,
): BackupReminderState {
	const next = { ...readBackupReminderState(), ...update };
	setItem(STORAGE_KEYS.BACKUP_REMINDER, JSON.stringify(next));
	return next;
}

export function recordBackup(now: Date = new Date()) {
	return writeBackupReminderState({ lastBackupAt: now.getTime() });
}

/**
 * A backup is due once a week, counted from the last backup or the last time
 * the user postponed the reminder, whichever is later.
 */
export function isBackupDue(
	state: BackupReminderState,
	now: Date = new Date(),
): boolean {
	if (state.mode === 'off') {
		return false;
	}
	const lastActivity = Math.max(
		state.lastBackupAt ?? 0,
		state.lastPromptAt ?? 0,
	);
	return now.getTime() - lastActivity >= BACKUP_INTERVAL_MS;
}
