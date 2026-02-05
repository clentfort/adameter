import { useCallback } from 'react';
import { useSnapshot } from 'valtio/react';
import { startPerformanceTimer } from '@/lib/performance-logging';

export interface ObjectWithId {
	id: string;
}

export function useArrayState<S extends ObjectWithId>(array: S[]) {
	const value = useSnapshot(array);
	return {
		add: useCallback(
			(item: S) => {
				const timer = startPerformanceTimer('state.array.add', {
					itemCountBefore: array.length,
				});
				array.push(normalize(item));
				timer.end({
					metadata: {
						itemCountAfter: array.length,
					},
				});
			},
			[array],
		),
		remove: useCallback(
			(id: string) => {
				const timer = startPerformanceTimer('state.array.remove', {
					itemCountBefore: array.length,
				});
				const index = array.findIndex((item) => item.id === id);
				if (index === -1) {
					timer.end({
						metadata: {
							itemCountAfter: array.length,
							removed: false,
						},
					});
					return;
				}
				array.splice(index, 1);
				timer.end({
					metadata: {
						itemCountAfter: array.length,
						removed: true,
					},
				});
			},
			[array],
		),
		replace: useCallback(
			(next: S[]) => {
				const timer = startPerformanceTimer('state.array.replace', {
					incomingItemCount: next.length,
					itemCountBefore: array.length,
				});
				array.splice(0, array.length, ...next.map((item) => normalize(item)));
				timer.end({
					metadata: {
						itemCountAfter: array.length,
					},
				});
			},
			[array],
		),
		update: useCallback(
			(update: S) => {
				const timer = startPerformanceTimer('state.array.update', {
					itemCountBefore: array.length,
				});
				const index = array.findIndex((item) => item.id === update.id);
				if (index === -1) {
					timer.end({
						metadata: {
							itemCountAfter: array.length,
							updated: false,
						},
					});
					return;
				}
				array[index] = normalize(update);
				timer.end({
					metadata: {
						itemCountAfter: array.length,
						updated: true,
					},
				});
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
