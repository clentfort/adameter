export type YjsEpochMode = 'production' | 'test';

const EPOCH_MODE_STORAGE_KEY = 'adameter-yjs-epoch-mode-v1';
const PRODUCTION_EPOCH_STORAGE_KEY = 'adameter-yjs-epoch-production-v1';
const TEST_EPOCH_STORAGE_KEY = 'adameter-yjs-epoch-test-v1';
const BASE_ROOM_STORAGE_KEY = 'adameter-room-base-v1';
const ROOM_STORAGE_KEY = 'room';
const PRODUCTION_ROOM_EPOCH_SEPARATOR = '__epoch__';
const TEST_ROOM_EPOCH_SEPARATOR = '__test-epoch__';
const BASE_PERSISTENCE_NAME = 'adameter';
const TEST_PERSISTENCE_NAME = 'adameter-test';

function canUseStorage() {
	return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeEpoch(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}

	return Math.floor(value);
}

function parseEpoch(value: string | null | undefined) {
	if (!value) {
		return 0;
	}

	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed)) {
		return 0;
	}

	return normalizeEpoch(parsed);
}

function isYjsEpochMode(
	value: string | null | undefined,
): value is YjsEpochMode {
	return value === 'production' || value === 'test';
}

function getEpochStorageKey(mode: YjsEpochMode) {
	if (mode === 'test') {
		return TEST_EPOCH_STORAGE_KEY;
	}

	return PRODUCTION_EPOCH_STORAGE_KEY;
}

function getRoomSuffixSeparator(mode: YjsEpochMode) {
	if (mode === 'test') {
		return TEST_ROOM_EPOCH_SEPARATOR;
	}

	return PRODUCTION_ROOM_EPOCH_SEPARATOR;
}

export function getYjsEpochMode(): YjsEpochMode {
	if (!canUseStorage()) {
		return 'production';
	}

	const mode = localStorage.getItem(EPOCH_MODE_STORAGE_KEY);
	if (!isYjsEpochMode(mode)) {
		return 'production';
	}

	return mode;
}

export function setYjsEpochMode(mode: YjsEpochMode) {
	if (!canUseStorage()) {
		return;
	}

	localStorage.setItem(EPOCH_MODE_STORAGE_KEY, mode);
}

export function getEpochFromRoom(room: string) {
	const productionSeparatorIndex = room.lastIndexOf(
		PRODUCTION_ROOM_EPOCH_SEPARATOR,
	);
	const testSeparatorIndex = room.lastIndexOf(TEST_ROOM_EPOCH_SEPARATOR);
	const separatorIndex = Math.max(productionSeparatorIndex, testSeparatorIndex);

	if (separatorIndex < 0) {
		return undefined;
	}

	const separator =
		testSeparatorIndex > productionSeparatorIndex
			? TEST_ROOM_EPOCH_SEPARATOR
			: PRODUCTION_ROOM_EPOCH_SEPARATOR;
	const epochRaw = room.slice(separatorIndex + separator.length);
	const parsed = Number.parseInt(epochRaw, 10);

	if (Number.isNaN(parsed) || parsed < 0) {
		return undefined;
	}

	return parsed;
}

export function getRoomModeFromRoom(room: string): YjsEpochMode {
	const testSeparatorIndex = room.lastIndexOf(TEST_ROOM_EPOCH_SEPARATOR);
	if (testSeparatorIndex !== -1) {
		const maybeEpoch = room.slice(
			testSeparatorIndex + TEST_ROOM_EPOCH_SEPARATOR.length,
		);
		if (/^\d+$/.test(maybeEpoch)) {
			return 'test';
		}
	}

	const productionSeparatorIndex = room.lastIndexOf(
		PRODUCTION_ROOM_EPOCH_SEPARATOR,
	);
	if (productionSeparatorIndex !== -1) {
		const maybeEpoch = room.slice(
			productionSeparatorIndex + PRODUCTION_ROOM_EPOCH_SEPARATOR.length,
		);
		if (/^\d+$/.test(maybeEpoch)) {
			return 'production';
		}
	}

	if (room.includes('__test__')) {
		return 'test';
	}

	return 'production';
}

export function getBaseRoom(room: string) {
	const productionSeparatorIndex = room.lastIndexOf(
		PRODUCTION_ROOM_EPOCH_SEPARATOR,
	);
	const testSeparatorIndex = room.lastIndexOf(TEST_ROOM_EPOCH_SEPARATOR);
	const separatorIndex = Math.max(productionSeparatorIndex, testSeparatorIndex);

	if (separatorIndex === -1) {
		return room;
	}

	const separator =
		testSeparatorIndex > productionSeparatorIndex
			? TEST_ROOM_EPOCH_SEPARATOR
			: PRODUCTION_ROOM_EPOCH_SEPARATOR;
	const maybeEpoch = room.slice(separatorIndex + separator.length);
	if (!/^\d+$/.test(maybeEpoch)) {
		return room;
	}

	return room.slice(0, separatorIndex);
}

export function toEpochRoom(
	baseRoom: string,
	epoch: number,
	mode: YjsEpochMode,
) {
	const normalizedEpoch = normalizeEpoch(epoch);

	if (mode === 'production' && normalizedEpoch === 0) {
		return baseRoom;
	}

	return `${baseRoom}${getRoomSuffixSeparator(mode)}${normalizedEpoch}`;
}

export function getYjsEpoch(mode = getYjsEpochMode()) {
	if (!canUseStorage()) {
		return 0;
	}

	return parseEpoch(localStorage.getItem(getEpochStorageKey(mode)));
}

export function setYjsEpoch(epoch: number, mode = getYjsEpochMode()) {
	if (!canUseStorage()) {
		return;
	}

	localStorage.setItem(getEpochStorageKey(mode), String(normalizeEpoch(epoch)));
}

export function incrementYjsEpoch(mode = getYjsEpochMode()) {
	const nextEpoch = getYjsEpoch(mode) + 1;
	setYjsEpoch(nextEpoch, mode);
	return nextEpoch;
}

export function getYjsPersistenceName(
	epoch = getYjsEpoch(),
	mode = getYjsEpochMode(),
) {
	const normalizedEpoch = normalizeEpoch(epoch);

	if (mode === 'production' && normalizedEpoch === 0) {
		return BASE_PERSISTENCE_NAME;
	}

	if (mode === 'test' && normalizedEpoch === 0) {
		return TEST_PERSISTENCE_NAME;
	}

	if (mode === 'test') {
		return `${TEST_PERSISTENCE_NAME}-epoch-${normalizedEpoch}`;
	}

	return `${BASE_PERSISTENCE_NAME}-epoch-${normalizedEpoch}`;
}

export function getStoredBaseRoom() {
	if (!canUseStorage()) {
		return undefined;
	}

	const storedBaseRoom = localStorage.getItem(BASE_ROOM_STORAGE_KEY);
	if (storedBaseRoom) {
		return storedBaseRoom;
	}

	const legacyRoom = localStorage.getItem(ROOM_STORAGE_KEY);
	if (!legacyRoom) {
		return undefined;
	}

	const modeFromLegacyRoom = getRoomModeFromRoom(legacyRoom);
	setYjsEpochMode(modeFromLegacyRoom);

	const baseRoom = getBaseRoom(legacyRoom);
	localStorage.setItem(BASE_ROOM_STORAGE_KEY, baseRoom);

	const parsedEpoch = getEpochFromRoom(legacyRoom);
	if (
		parsedEpoch !== undefined &&
		parsedEpoch > getYjsEpoch(modeFromLegacyRoom)
	) {
		setYjsEpoch(parsedEpoch, modeFromLegacyRoom);
	}

	return baseRoom;
}

export function setStoredBaseRoom(
	room: string | undefined,
	{
		epoch = getYjsEpoch(),
		mode = getYjsEpochMode(),
	}: {
		epoch?: number;
		mode?: YjsEpochMode;
	} = {},
) {
	if (!canUseStorage()) {
		return;
	}

	if (!room) {
		localStorage.removeItem(BASE_ROOM_STORAGE_KEY);
		localStorage.removeItem(ROOM_STORAGE_KEY);
		return;
	}

	const normalizedRoom = getBaseRoom(room);
	localStorage.setItem(BASE_ROOM_STORAGE_KEY, normalizedRoom);
	localStorage.setItem(
		ROOM_STORAGE_KEY,
		toEpochRoom(normalizedRoom, epoch, mode),
	);
}

export function getEffectiveRoom(
	baseRoom: string | undefined,
	epoch = getYjsEpoch(),
	mode = getYjsEpochMode(),
) {
	if (!baseRoom) {
		return undefined;
	}

	return toEpochRoom(baseRoom, epoch, mode);
}
