import { useCallback, useEffect, useState } from 'react';
import { decrypt, encrypt, Encrypted } from '@/utils/crypto';
import { ObjectWithId, useArrayState } from './use-array-state';
import { useEncryptionKey } from './use-encryption-key';

function encryptWithoutId<T extends ObjectWithId>(
	{ id, ...rest }: T,
	secret: string,
) {
	// @ts-expect-error Spread types may only be created from object types.
	return { id, ...encrypt(rest, secret) };
}

function decryptWithoutId<T extends Encrypted<ObjectWithId>>(
	{ id, ...rest }: T,
	secret: string,
) {
	// @ts-expect-error Spread types may only be created from object types.
	return { id, ...decrypt(rest, secret) };
}

export function useEncryptedArrayState<T extends ObjectWithId>(
	array: Encrypted<T[]>,
	backupKey: string,
) {
	const {
		add,
		remove,
		replace,
		update,
		value: encryptedValue,
	} = useArrayState(array);
	const [value, setValue] = useState<ReadonlyArray<T>>([]);
	const secret = useEncryptionKey();


  const bypass = (window.localStorage.getItem('has-decrypted') === 'true') 

	useEffect(() => {
    if (bypass) {
      return;
    }

		const decryptedValue = encryptedValue.map((value) =>
			// @ts-expect-error Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
			decryptWithoutId(value, secret),
		);
		setValue(decryptedValue);
	}, [encryptedValue, secret, bypass]);


  if (bypass) {
    return {
      add, remove, replace, update, value: encryptedValue}
    }


  


	return {
		add: useCallback(
			(item: T) => {
				const localStorageArray: T[] = JSON.parse(
					localStorage.getItem(backupKey) ?? '[]',
				);
				localStorage.setItem(
					backupKey,
					JSON.stringify([item, ...localStorageArray]),
				);
				// @ts-expect-error Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
				return add(encryptWithoutId(item, secret));
			},
			[add, secret, backupKey],
		),
		remove: useCallback(
			(id: string) => {
				const localStorageArray: T[] = JSON.parse(
					localStorage.getItem(backupKey) ?? '[]',
				);
				localStorage.setItem(
					backupKey,
					JSON.stringify(localStorageArray.filter((item) => item.id !== id)),
				);
				return remove(id);
			},
			[remove, backupKey],
		),
		replace: useCallback(
			(next: T[]) => {
				localStorage.setItem(
					`${backupKey}_${new Date().toISOString()}`,
					localStorage.getItem(backupKey) ?? '[]',
				);
				// @ts-expect-error Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
				replace(next.map((value) => encryptWithoutId(value, secret)));
			},
			[replace, secret, backupKey],
		),
		update: useCallback(
			(nextItem: T) => {
				const localStorageArray: T[] = JSON.parse(
					localStorage.getItem(backupKey) ?? '[]',
				);
				localStorage.setItem(
					backupKey,
					JSON.stringify(
						localStorageArray.map((item) => {
							return item.id === nextItem.id ? nextItem : item;
						}),
					),
				);
				// @ts-expect-error Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
				return update(encryptWithoutId(nextItem, secret));
			},
			[secret, update, backupKey],
		),
		value,
	} as const;
}
