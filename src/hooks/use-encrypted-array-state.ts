import { useCallback, useEffect, useState } from 'react';
import { decrypt, encrypt, Encrypted } from '@/utils/crypto';
import { ObjectWithId, useArrayState } from './use-array-state';
import { useEncryptionKey } from './use-encryption-key';

function encryptWithoutId<T extends ObjectWithId>(
	{ id, ...rest }: T,
	secret: string,
) {
	return { id, ...encrypt(rest, secret) };
}

function decryptWithoutId<T extends Encrypted<ObjectWithId>>(
	{ id, ...rest }: T,
	secret: string,
) {
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

	useEffect(() => {
		if (secret && secret.length > 0) {
			try {
				const decryptedValue = encryptedValue.map((item) =>
					decryptWithoutId(item, secret),
				);
				setValue(decryptedValue);
			} catch {
				// console.error('Failed to decrypt data in useEncryptedArrayState:', e);
				setValue([]); // Fallback to empty array on decryption error
			}
		} else {
			// If secret is not available, treat as if there's no data to decrypt or show
			setValue([]);
		}
	}, [encryptedValue, secret]);

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
				return update(encryptWithoutId(nextItem, secret));
			},
			[secret, update, backupKey],
		),
		value,
	} as const;
}
