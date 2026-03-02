import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRowIds, useStore } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useLatestDiaperChange } from './use-latest-diaper-change';

vi.mock('tinybase/ui-react', async () => {
	const actual = await vi.importActual('tinybase/ui-react');
	return {
		...actual,
		useRowIds: vi.fn(),
		useStore: vi.fn(),
	};
});

describe('useLatestDiaperChange', () => {
	it('should return undefined if there are no diaper changes', () => {
		vi.mocked(useRowIds).mockReturnValue([]);
		vi.mocked(useStore).mockReturnValue({
			getCell: vi.fn(),
			getRow: vi.fn(),
		} as any);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toBeUndefined();
	});

	it('should return the diaper change if there is only one', () => {
		const singleChange = {
			containsStool: false,
			containsUrine: true,
			id: '1',
			timestamp: '2023-01-01T12:00:00Z',
		};
		vi.mocked(useRowIds).mockReturnValue(['1']);
		vi.mocked(useStore).mockReturnValue({
			getCell: vi.fn().mockReturnValue('2023-01-01T12:00:00Z'),
			getRow: vi.fn().mockReturnValue(singleChange),
		} as any);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(singleChange);
	});

	it('should return the latest diaper change', () => {
		const changes = [
			{ id: '1', timestamp: '2023-01-01T10:00:00Z' },
			{ id: '2', timestamp: '2023-01-01T11:00:00Z' },
			{ id: '3', timestamp: '2023-01-01T12:00:00Z' },
		];
		vi.mocked(useRowIds).mockReturnValue(['1', '2', '3']);
		vi.mocked(useStore).mockReturnValue({
			getCell: vi.fn().mockImplementation((_table, id) => {
				return changes.find((c) => c.id === id)?.timestamp;
			}),
			getRow: vi.fn().mockImplementation((_table, id) => {
				return changes.find((c) => c.id === id);
			}),
		} as any);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(changes[2]);
	});
});
