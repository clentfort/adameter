import { act, renderHook } from '@testing-library/react';
import { useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getItem, removeItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';

// Variable starting with "mock" is allowed by Vitest hoisting
let mockStorage: Record<string, string> = {};

vi.mock('@/lib/storage', () => {
	return {
		STORAGE_KEYS: {
			DEVICE_ID: 'deviceId',
			PREFERRED_LANGUAGE: 'preferredLanguage',
			ROOM: 'room',
			ROOM_JOIN_STRATEGY: 'room-join-strategy',
			SHOW_COMPARISON_CHARTS: 'adameter-show-comparison',
		},
		getItem: vi.fn((key: string) => mockStorage[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			mockStorage[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete mockStorage[key];
		}),
	};
});

describe('DataSynchronizationContext', () => {
	beforeEach(() => {
		mockStorage = {};
		vi.clearAllMocks();
	});

	it('should return default values outside the provider', () => {
		const { result } = renderHook(() => useContext(DataSynchronizationContext));
		expect(result.current.isHydrated).toBe(false);
		expect(result.current.room).toBeUndefined();
		expect(result.current.joinStrategy).toBe('merge');

		// Call dummy functions to cover default values
		act(() => {
			result.current.joinRoom('r1', 'merge');
			result.current.leaveRoom();
			result.current.resetJoinStrategy();
			result.current.setRoom('r1');
		});
	});

	it('should restore room and join strategy from local storage on mount', () => {
		mockStorage[STORAGE_KEYS.ROOM] = 'stored-room';
		mockStorage[STORAGE_KEYS.ROOM_JOIN_STRATEGY] = 'overwrite';

		const { result } = renderHook(
			() => useContext(DataSynchronizationContext),
			{
				wrapper: DataSynchronizationProvider,
			},
		);

		expect(result.current.isHydrated).toBe(true);
		expect(result.current.room).toBe('stored-room');
		expect(result.current.joinStrategy).toBe('overwrite');
		expect(getItem).toHaveBeenCalledWith(STORAGE_KEYS.ROOM);
		expect(getItem).toHaveBeenCalledWith(STORAGE_KEYS.ROOM_JOIN_STRATEGY);
	});

	it('should fallback to merge strategy if restored strategy is invalid', () => {
		mockStorage[STORAGE_KEYS.ROOM] = 'stored-room';
		mockStorage[STORAGE_KEYS.ROOM_JOIN_STRATEGY] = 'invalid-strategy';

		const { result } = renderHook(
			() => useContext(DataSynchronizationContext),
			{
				wrapper: DataSynchronizationProvider,
			},
		);

		expect(result.current.isHydrated).toBe(true);
		expect(result.current.room).toBe('stored-room');
		expect(result.current.joinStrategy).toBe('merge');
	});

	it('should not restore any room if room is not in storage', () => {
		const { result } = renderHook(
			() => useContext(DataSynchronizationContext),
			{
				wrapper: DataSynchronizationProvider,
			},
		);

		expect(result.current.isHydrated).toBe(true);
		expect(result.current.room).toBeUndefined();
	});

	it('should update room and join strategy when joinRoom is called', () => {
		const { result } = renderHook(
			() => useContext(DataSynchronizationContext),
			{
				wrapper: DataSynchronizationProvider,
			},
		);

		act(() => {
			result.current.joinRoom('new-room', 'clear');
		});

		expect(result.current.room).toBe('new-room');
		expect(result.current.joinStrategy).toBe('clear');
		expect(setItem).toHaveBeenCalledWith(STORAGE_KEYS.ROOM, 'new-room');
		expect(setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.ROOM_JOIN_STRATEGY,
			'clear',
		);
	});

	it('should reset room and default to merge strategy when leaveRoom is called', () => {
		mockStorage[STORAGE_KEYS.ROOM] = 'stored-room';
		mockStorage[STORAGE_KEYS.ROOM_JOIN_STRATEGY] = 'overwrite';

		const { result } = renderHook(
			() => useContext(DataSynchronizationContext),
			{
				wrapper: DataSynchronizationProvider,
			},
		);

		act(() => {
			result.current.leaveRoom();
		});

		expect(result.current.room).toBeUndefined();
		expect(result.current.joinStrategy).toBe('merge');
		expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ROOM);
		expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ROOM_JOIN_STRATEGY);
	});

	it('should change joinStrategy to overwrite when resetJoinStrategy is called', () => {
		const { result } = renderHook(
			() => useContext(DataSynchronizationContext),
			{
				wrapper: DataSynchronizationProvider,
			},
		);

		act(() => {
			result.current.joinRoom('some-room', 'merge');
		});

		act(() => {
			result.current.resetJoinStrategy();
		});

		expect(result.current.joinStrategy).toBe('overwrite');
		expect(setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.ROOM_JOIN_STRATEGY,
			'overwrite',
		);
	});

	it('should change room when setRoom is called', () => {
		const { result } = renderHook(
			() => useContext(DataSynchronizationContext),
			{
				wrapper: DataSynchronizationProvider,
			},
		);

		act(() => {
			result.current.setRoom('another-room');
		});

		expect(result.current.room).toBe('another-room');
		expect(setItem).toHaveBeenCalledWith(STORAGE_KEYS.ROOM, 'another-room');
	});
});
