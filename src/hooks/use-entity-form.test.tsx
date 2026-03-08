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
			useEntityForm(schema as any, { name: 'initial' }),
		);

		expect(result.current.getValues()).toEqual({ name: 'initial' });
	});

	it('resets when props change', () => {
		const { rerender, result } = renderHook(
			({ name }) =>
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				useEntityForm(schema as any, { name }),
			{
				initialProps: { name: 'first' },
			},
		);

		expect(result.current.getValues()).toEqual({ name: 'first' });

		rerender({ name: 'second' });

		expect(result.current.getValues()).toEqual({ name: 'second' });
	});
});
