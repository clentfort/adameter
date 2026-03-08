import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { useEntityForm } from './use-entity-form';

const schema = z.object({
	name: z.string(),
});

const getDefaultValuesInitial = () => ({ name: 'initial' });

describe('useEntityForm', () => {
	it('initializes with default values', () => {
		const { result } = renderHook(() =>
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			useEntityForm(schema as any, getDefaultValuesInitial),
		);

		expect(result.current.getValues()).toEqual({ name: 'initial' });
	});

	it('resets when deps change', () => {
		const { rerender, result } = renderHook(
			({ dep, name }) =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				useEntityForm(schema as any, () => ({ name }), [dep]),
			{
				initialProps: { dep: 1, name: 'first' },
			},
		);

		expect(result.current.getValues()).toEqual({ name: 'first' });

		rerender({ dep: 2, name: 'second' });

		expect(result.current.getValues()).toEqual({ name: 'second' });
	});
});
