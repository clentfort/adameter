import { z } from 'zod';

export function emptyStringToUndefined(value: unknown) {
	if (typeof value !== 'string') {
		return value;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export const requiredBooleanField = z.boolean();

export const optionalBooleanCell = z.preprocess(
	emptyStringToUndefined,
	z.boolean().optional(),
);

export const optionalNumberCell = z.preprocess((value) => {
	const normalizedValue = emptyStringToUndefined(value);
	if (typeof normalizedValue === 'string') {
		const numericValue = Number(normalizedValue);
		return Number.isFinite(numericValue) ? numericValue : normalizedValue;
	}

	return normalizedValue;
}, z.number().finite().optional());

export const optionalPositiveNumberCell = z.preprocess((value) => {
	const normalizedValue = emptyStringToUndefined(value);
	if (typeof normalizedValue === 'string') {
		const numericValue = Number(normalizedValue);
		return Number.isFinite(numericValue) ? numericValue : normalizedValue;
	}

	return normalizedValue;
}, z.number().finite().positive().optional());

export const optionalIntegerCell = z.preprocess((value) => {
	const normalizedValue = emptyStringToUndefined(value);
	if (typeof normalizedValue === 'string') {
		const numericValue = Number(normalizedValue);
		return Number.isInteger(numericValue) ? numericValue : normalizedValue;
	}

	return normalizedValue;
}, z.number().int().optional());

export const integerCell = z.preprocess((value) => {
	if (typeof value === 'string') {
		const trimmedValue = value.trim();
		const numericValue = Number(trimmedValue);
		return Number.isInteger(numericValue) ? numericValue : value;
	}

	return value;
}, z.number().int());

export const optionalStringCell = z.preprocess(
	emptyStringToUndefined,
	z.string().trim().min(1).optional(),
);

export const requiredNameField = z.string().trim().min(1);

export function numericInputField(message: string) {
	return z
		.string()
		.optional()
		.refine(
			(value) =>
				value === undefined ||
				value.length === 0 ||
				!Number.isNaN(Number(value)),
			{ message },
		);
}

export function positiveNumericInputField(message: string) {
	return z.string().refine((value) => value === '' || Number(value) > 0, {
		message,
	});
}

export function optionalNumberFromInputField(message: string) {
	return numericInputField(message).transform((value) => {
		if (value === undefined || value.length === 0) {
			return undefined;
		}

		const parsedValue = Number(value);
		return Number.isFinite(parsedValue) ? parsedValue : undefined;
	});
}

export function optionalPositiveNumberFromInputField(message: string) {
	return positiveNumericInputField(message).transform((value) => {
		if (value.length === 0) {
			return undefined;
		}

		const parsedValue = Number(value);
		return Number.isFinite(parsedValue) && parsedValue > 0
			? parsedValue
			: undefined;
	});
}
