import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_SELECTED_PROFILE_ID,
} from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useFeedingInProgress } from './use-feeding-in-progress';

describe('useFeedingInProgress', () => {
	it('should return null when not set', () => {
		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBeNull();
	});

	it('should set and return a feeding in progress', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		const feeding = {
			breast: 'left' as const,
			startTime: '2024-01-01T10:00:00Z',
		};

		act(() => {
			result.current[1](feeding);
		});

		expect(result.current[0]).toEqual(feeding);
		expect(store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS)).toBe(
			JSON.stringify(feeding),
		);
	});

	it('should clear feeding in progress when null is passed', () => {
		const store = createTestStore();
		store.setValue(
			STORE_VALUE_FEEDING_IN_PROGRESS,
			JSON.stringify({ breast: 'left', startTime: '2024-01-01T10:00:00Z' }),
		);

		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current[1](null);
		});

		expect(result.current[0]).toBeNull();
		expect(store.hasValue(STORE_VALUE_FEEDING_IN_PROGRESS)).toBe(false);
	});

	it('should handle multi-profile isolation', () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'profile-1');
		store.setValue(
			STORE_VALUE_FEEDING_IN_PROGRESS,
			JSON.stringify({
				breast: 'left',
				profileId: 'profile-2',
				startTime: '2024-01-01T10:00:00Z',
			}),
		);

		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		// Should be null because it belongs to a different profile
		expect(result.current[0]).toBeNull();

		// Setting should inject the current profile ID
		act(() => {
			result.current[1]({
				breast: 'right',
				startTime: '2024-01-01T11:00:00Z',
			});
		});

		expect(result.current[0]).toEqual({
			breast: 'right',
			profileId: 'profile-1',
			startTime: '2024-01-01T11:00:00Z',
		});
		expect(
			JSON.parse(store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) as string),
		).toEqual({
			breast: 'right',
			profileId: 'profile-1',
			startTime: '2024-01-01T11:00:00Z',
		});
	});

	it('should return null for invalid data', () => {
		const store = createTestStore();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		// Invalid JSON
		act(() => {
			store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, '{invalid-json');
		});
		expect(result.current[0]).toBeNull();

		// Invalid schema (missing startTime)
		act(() => {
			store.setValue(
				STORE_VALUE_FEEDING_IN_PROGRESS,
				JSON.stringify({ breast: 'left' }),
			);
		});
		expect(result.current[0]).toBeNull();
		expect(warnSpy).toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});
