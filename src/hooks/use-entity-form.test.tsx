import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { useEntityForm } from './use-entity-form';

const schema = z.object({
	name: z.string(),
});

describe('useEntityForm', () => {
	it('initializes with default values', () => {
		const getDefaultValues = () => ({ name: 'initial' });
		const { result } = renderHook(() => useEntityForm(schema, getDefaultValues));

		expect(result.current.getValues()).toEqual({ name: 'initial' });
	});

	it('resets when deps change', () => {
		let name = 'first';
		const getDefaultValues = () => ({ name });
		const { rerender, result } = renderHook(
			({ dep }) => useEntityForm(schema, getDefaultValues, [dep]),
			{
				initialProps: { dep: 1 },
			},
		);

		expect(result.current.getValues()).toEqual({ name: 'first' });

		name = 'second';
		rerender({ dep: 2 });

		expect(result.current.getValues()).toEqual({ name: 'second' });
	});
});
