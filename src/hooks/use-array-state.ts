import { useCallback, useEffect, useState } from 'react';
import { useSnapshot } from 'valtio/react';
import { decrypt, encrypt, Encrypted } from '@/utils/crypto';

export function useArrayState<T extends { id: string }>(array: Encrypted<T>[]) {
	const value = useSnapshot(array);
	const [decryptedValue, setDecryptedValue] = useState<ReadonlyArray<T>>([]);

	useEffect(() => {
		// @ts-expect-error Figure out better typing for this later
		setDecryptedValue(value.map((v) => decrypt(v, 'secret')));
	}, [value]);
	return {
		add: useCallback(
			(item: T) => {
				// Using JSON.stringify + parse as a quick way to get rid of any
				// `undefined` values as this causes a render freeze with valtio/yjs
				// eslint-disable-next-line unicorn/prefer-structured-clone
				array.unshift(JSON.parse(JSON.stringify(encrypt(item, 'secret'))));
			},
			[array],
		),
		remove: useCallback(
			(id: string) => {
				const index = decryptedValue.findIndex((item) => item.id === id);
				if (index === -1) {
					return;
				}
				array.splice(index, 1);
			},
			[array, decryptedValue],
		),
		update: useCallback(
			(update: T) => {
				const index = decryptedValue.findIndex((item) => item.id === update.id);
				if (index === -1) {
					return;
				}
				array[index] = encrypt(update, 'secret');
			},
			[array, decryptedValue],
		),
		value: decryptedValue,
	} as const;
}
