import { useSetValueCallback, useValue } from 'tinybase/ui-react';

export function useStoreValueSetting<T extends string | number | boolean>(
	valueId: string,
	fallback: T,
): readonly [T, (value: T) => void] {
	const value = useValue(valueId) as T | undefined;

	const setValue = useSetValueCallback(valueId, (newValue: T) => newValue, []);

	return [value ?? fallback, setValue] as const;
}
