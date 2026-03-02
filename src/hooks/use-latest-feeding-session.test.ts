import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRowIds, useStore } from 'tinybase/ui-react';
import { useLatestFeedingSession } from './use-latest-feeding-session';

vi.mock('tinybase/ui-react', async () => {
	const actual = await vi.importActual('tinybase/ui-react');
	return {
		...actual,
		useRowIds: vi.fn(),
		useStore: vi.fn(),
	};
});

describe('useLatestFeedingSession', () => {
	it('should return undefined if there are no feeding sessions', () => {
		vi.mocked(useRowIds).mockReturnValue([]);
		vi.mocked(useStore).mockReturnValue({
			getCell: vi.fn(),
			getRow: vi.fn(),
		} as any);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toBeUndefined();
	});

	it('should return the feeding session if there is only one', () => {
		const singleSession = {
			breast: 'left',
			durationInSeconds: 1800,
			endTime: '2023-01-01T12:00:00Z',
			id: '1',
			startTime: '2023-01-01T11:30:00Z',
		};
		vi.mocked(useRowIds).mockReturnValue(['1']);
		vi.mocked(useStore).mockReturnValue({
			getCell: vi.fn().mockReturnValue('2023-01-01T12:00:00Z'),
			getRow: vi.fn().mockReturnValue(singleSession),
		} as any);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(singleSession);
	});

	it('should return the latest feeding session (by endTime)', () => {
		const sessions = [
			{ id: '1', endTime: '2023-01-01T10:00:00Z' },
			{ id: '2', endTime: '2023-01-01T11:00:00Z' },
			{ id: '3', endTime: '2023-01-01T12:00:00Z' },
		];
		vi.mocked(useRowIds).mockReturnValue(['1', '2', '3']);
		vi.mocked(useStore).mockReturnValue({
			getCell: vi.fn().mockImplementation((_table, id) => {
				return sessions.find((s) => s.id === id)?.endTime;
			}),
			getRow: vi.fn().mockImplementation((_table, id) => {
				return sessions.find((s) => s.id === id);
			}),
		} as any);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(sessions[2]);
	});
});
