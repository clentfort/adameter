import { act, renderHook, waitFor } from '@testing-library/react';
import { proxy } from 'valtio';
import { describe, expect, it } from 'vitest';
import { useArrayState } from './use-array-state';

describe('useArrayState', () => {
	it('should add an item to the array', async () => {
		const array = proxy<{ id: string; name: string }[]>([]);
		const { result } = renderHook(() => useArrayState(array));

		act(() => {
			result.current.add({ id: '1', name: 'Test' });
		});

		expect(array).toHaveLength(1);
		await waitFor(() => {
			expect(result.current.value).toHaveLength(1);
		});
		expect(result.current.value[0]).toEqual({ id: '1', name: 'Test' });
		expect(array).toHaveLength(1);
		expect(array[0]).toEqual({ id: '1', name: 'Test' });
	});
});
