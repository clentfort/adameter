import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

describe('useArrayState', () => {
	it('adds an item to a Tinybase table-backed array', async () => {
		const store = createStore();
		const wrapper = ({ children }: { children: ReactNode }) =>
			createElement(tinybaseContext.Provider, { value: { store } }, children);

		const { result } = renderHook(
			() => useArrayState<{ id: string; name: string }>(TABLE_IDS.EVENTS),
			{ wrapper },
		);

		act(() => {
			result.current.add({ id: '1', name: 'Test' });
		});

		await waitFor(() => {
			expect(result.current.value).toHaveLength(1);
		});

		expect(result.current.value[0]).toEqual({ id: '1', name: 'Test' });
		expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(1);
	});
});
