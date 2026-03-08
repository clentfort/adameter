import type { DefaultValues, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export function useEntityForm<
	TFieldValues extends FieldValues = FieldValues,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TContext = any,
	TTransformedValues extends FieldValues | undefined = undefined,
>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	schema: ZodType<any, any, any>,
	getDefaultValues: () => DefaultValues<TFieldValues>,
	deps: unknown[] = [],
) {
	const form = useForm<TFieldValues, TContext, TTransformedValues>({
		defaultValues: getDefaultValues(),
		mode: 'onChange',
		resolver: zodResolver(schema),
	});

	const { reset } = form;

	useEffect(() => {
		reset(getDefaultValues());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return form;
}
