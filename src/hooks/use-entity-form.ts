import type { DefaultValues, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export function useEntityForm<
	TFieldValues extends FieldValues = FieldValues,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TContext = any,
	TTransformedValues extends FieldValues | undefined = undefined,
>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	schema: ZodType<any, any, any>,
	defaultValues: DefaultValues<TFieldValues>,
) {
	return useForm<TFieldValues, TContext, TTransformedValues>({
		mode: 'onChange',
		resolver: zodResolver(schema),
		values: defaultValues as TFieldValues,
	});
}
