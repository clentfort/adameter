import { useCallback } from 'react';
import { useSnapshot } from 'valtio/react';

export interface ObjectWithId {
	id: string;
}

export function useArrayState<S extends ObjectWithId>(array: S[]) {
	const value = useSnapshot(array);
	return {
		add: useCallback(
			(item: S) => {
				array.unshift(normalize(item));
			},
			[array],
		),
		remove: useCallback(
			(id: string) => {
				const index = array.findIndex((item) => item.id === id);
				if (index === -1) {
					// console.log('could not find item with id', id); // Removed for linting
					return;
				}
				array.splice(index, 1);
			},
			[array],
		),
		replace: useCallback(
			(next: S[]) => {
				array.splice(0, array.length, ...next.map((item) => normalize(item)));
			},
			[array],
		),
		update: useCallback(
			(update: S) => {
				const index = array.findIndex((item) => item.id === update.id);
				if (index === -1) {
					return;
				}
				array[index] = normalize(update);
			},
			[array],
		),
		value,
	} as const;
}

function normalize<T extends ObjectWithId>(item: T) {
	// Using JSON.stringify + parse as a quick way to get rid of any
	// `undefined` values as this causes a render freeze with valtio/yjs
	// eslint-disable-next-line unicorn/prefer-structured-clone
	return JSON.parse(JSON.stringify(item));
}
