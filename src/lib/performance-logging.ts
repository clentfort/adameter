type Primitive = boolean | null | number | string;

export interface PerformanceLogEntry {
	at: string;
	deviceLabel: string;
	durationMs?: number;
	id: string;
	metadata?: Record<string, Primitive>;
	name: string;
	room?: string;
	sessionId: string;
	value?: number;
}

export interface PerformanceSummary {
	averageMs: number;
	count: number;
	lastAt: string;
	maxMs: number;
	name: string;
	p95Ms: number;
}

interface PerformanceLogOptions {
	throttleKey?: string;
	throttleMs?: number;
}

const LOG_STORAGE_KEY = 'adameter-performance-logs-v1';
const LABEL_STORAGE_KEY = 'adameter-performance-label-v1';
const ROOM_STORAGE_KEY = 'adameter-performance-room-v1';
const MAX_LOGS = 1200;
const UPDATE_EVENT_NAME = 'adameter:performance-log-updated';

let cachedLogs: PerformanceLogEntry[] | null = null;
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let roomCache: string | undefined;
let sessionIdCache: string | undefined;

const lastLogAt = new Map<string, number>();

function canUseStorage() {
	return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readLogsFromStorage(): PerformanceLogEntry[] {
	if (!canUseStorage()) {
		return [];
	}

	try {
		const raw = localStorage.getItem(LOG_STORAGE_KEY);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed as PerformanceLogEntry[];
	} catch {
		return [];
	}
}

function getLogsMutable() {
	if (cachedLogs) {
		return cachedLogs;
	}
	cachedLogs = readLogsFromStorage();
	return cachedLogs;
}

function flushLogsSoon() {
	if (!canUseStorage() || flushTimer) {
		return;
	}

	flushTimer = setTimeout(() => {
		flushTimer = undefined;
		if (!canUseStorage() || !cachedLogs) {
			return;
		}

		try {
			localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(cachedLogs));
			window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
		} catch {
			// Ignore storage failures.
		}
	}, 200);
}

function getSessionId() {
	if (sessionIdCache) {
		return sessionIdCache;
	}

	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.randomUUID === 'function'
	) {
		sessionIdCache = crypto.randomUUID();
		return sessionIdCache;
	}

	sessionIdCache = `session-${Date.now().toString(36)}`;
	return sessionIdCache;
}

function sanitizeMetadata(
	metadata: Record<string, unknown> | undefined,
): Record<string, Primitive> | undefined {
	if (!metadata) {
		return undefined;
	}

	const result: Record<string, Primitive> = {};

	for (const [key, value] of Object.entries(metadata)) {
		if (value === null) {
			result[key] = null;
			continue;
		}

		if (
			typeof value === 'boolean' ||
			typeof value === 'number' ||
			typeof value === 'string'
		) {
			result[key] = value;
			continue;
		}

		if (Object.prototype.toString.call(value) === '[object Date]') {
			const dateValue = value as Date;
			if (!Number.isNaN(dateValue.getTime())) {
				result[key] = dateValue.toISOString();
				continue;
			}
		}

		result[key] = String(value);
	}

	return Object.keys(result).length > 0 ? result : undefined;
}

function shouldThrottle(
	name: string,
	{ throttleKey, throttleMs }: PerformanceLogOptions,
) {
	if (!throttleMs || throttleMs <= 0) {
		return false;
	}

	const key = throttleKey ?? name;
	const now = Date.now();
	const previous = lastLogAt.get(key);

	if (previous && now - previous < throttleMs) {
		return true;
	}

	lastLogAt.set(key, now);
	return false;
}

export function getCurrentPerformanceRoom() {
	if (roomCache !== undefined) {
		return roomCache;
	}

	if (!canUseStorage()) {
		return undefined;
	}

	roomCache = localStorage.getItem(ROOM_STORAGE_KEY) ?? undefined;
	return roomCache;
}

export function setCurrentPerformanceRoom(room: string | undefined) {
	roomCache = room;

	if (!canUseStorage()) {
		return;
	}

	if (!room) {
		localStorage.removeItem(ROOM_STORAGE_KEY);
		return;
	}

	localStorage.setItem(ROOM_STORAGE_KEY, room);
}

export function getPerformanceDeviceLabel() {
	if (!canUseStorage()) {
		return '';
	}

	return localStorage.getItem(LABEL_STORAGE_KEY) ?? '';
}

export function setPerformanceDeviceLabel(label: string) {
	if (!canUseStorage()) {
		return;
	}

	const normalizedLabel = label.trim();

	if (!normalizedLabel) {
		localStorage.removeItem(LABEL_STORAGE_KEY);
		return;
	}

	localStorage.setItem(LABEL_STORAGE_KEY, normalizedLabel);
}

export function logPerformanceEvent(
	name: string,
	{
		durationMs,
		metadata,
		value,
	}: {
		durationMs?: number;
		metadata?: Record<string, unknown>;
		value?: number;
	} = {},
	options: PerformanceLogOptions = {},
) {
	if (!canUseStorage()) {
		return;
	}

	if (shouldThrottle(name, options)) {
		return;
	}

	const logs = getLogsMutable();
	const entry: PerformanceLogEntry = {
		at: new Date().toISOString(),
		deviceLabel: getPerformanceDeviceLabel(),
		id:
			typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
		metadata: sanitizeMetadata(metadata),
		name,
		room: getCurrentPerformanceRoom(),
		sessionId: getSessionId(),
	};

	if (typeof durationMs === 'number' && Number.isFinite(durationMs)) {
		entry.durationMs = Number(durationMs.toFixed(2));
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		entry.value = value;
	}

	logs.push(entry);

	if (logs.length > MAX_LOGS) {
		logs.splice(0, logs.length - MAX_LOGS);
	}

	flushLogsSoon();
}

export function startPerformanceTimer(
	name: string,
	metadata?: Record<string, unknown>,
) {
	const start =
		typeof performance !== 'undefined' ? performance.now() : Date.now();

	return {
		end(
			extra: {
				metadata?: Record<string, unknown>;
				options?: PerformanceLogOptions;
			} = {},
		) {
			const now =
				typeof performance !== 'undefined' ? performance.now() : Date.now();
			const durationMs = now - start;

			logPerformanceEvent(
				name,
				{
					durationMs,
					metadata: {
						...metadata,
						...extra.metadata,
					},
				},
				extra.options,
			);

			return durationMs;
		},
	};
}

export function getPerformanceLogs() {
	if (cachedLogs) {
		return [...cachedLogs];
	}

	return [...readLogsFromStorage()];
}

export function clearPerformanceLogs() {
	cachedLogs = [];

	if (!canUseStorage()) {
		return;
	}

	localStorage.removeItem(LOG_STORAGE_KEY);
	window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
}

function getPercentile(values: number[], percentile: number) {
	if (values.length === 0) {
		return 0;
	}

	const index = Math.ceil((percentile / 100) * values.length) - 1;
	return values[Math.max(0, Math.min(index, values.length - 1))];
}

export function getPerformanceSummaries(limit = 15): PerformanceSummary[] {
	const logsWithDurations = getPerformanceLogs().filter(
		(log) => typeof log.durationMs === 'number',
	);

	const grouped = new Map<string, PerformanceLogEntry[]>();
	for (const entry of logsWithDurations) {
		const current = grouped.get(entry.name) ?? [];
		current.push(entry);
		grouped.set(entry.name, current);
	}

	const summaries = Array.from(grouped.entries()).map(([name, entries]) => {
		const values = entries
			.map((entry) => entry.durationMs as number)
			.sort((a, b) => a - b);

		const total = values.reduce((sum, value) => sum + value, 0);
		const averageMs = values.length > 0 ? total / values.length : 0;
		const p95Ms = getPercentile(values, 95);
		const maxMs = values.at(-1) ?? 0;

		return {
			averageMs: Number(averageMs.toFixed(2)),
			count: entries.length,
			lastAt: entries.at(-1)?.at ?? '',
			maxMs: Number(maxMs.toFixed(2)),
			name,
			p95Ms: Number(p95Ms.toFixed(2)),
		};
	});

	return summaries.sort((a, b) => b.p95Ms - a.p95Ms).slice(0, limit);
}

export function createPerformanceReport() {
	const logs = getPerformanceLogs();

	return JSON.stringify(
		{
			device: {
				label: getPerformanceDeviceLabel(),
				language:
					typeof navigator !== 'undefined' ? navigator.language : undefined,
				platform:
					typeof navigator !== 'undefined' ? navigator.platform : undefined,
				userAgent:
					typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
				viewport:
					typeof window !== 'undefined'
						? `${window.innerWidth}x${window.innerHeight}`
						: undefined,
			},
			generatedAt: new Date().toISOString(),
			logCount: logs.length,
			logs,
			room: getCurrentPerformanceRoom(),
			sessionId: getSessionId(),
			summary: getPerformanceSummaries(30),
		},
		null,
		2,
	);
}

export const PERFORMANCE_LOG_UPDATED_EVENT = UPDATE_EVENT_NAME;
