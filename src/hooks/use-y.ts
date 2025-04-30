import { useContext, useRef, useSyncExternalStore } from 'react';
import { AbstractType, Array as YArray, Map as YMap } from 'yjs';
import { yjsContext } from '@/contexts/yjs-context';

export function useYMap<T>(name: string) {
	const { doc } = useContext(yjsContext);
	const map = doc.getMap<T>(name);
	return useYObject(map);
}

export function useYArray<T>(name: string) {
	const { doc } = useContext(yjsContext);
	const array = doc.getArray<T>(name);
	return useYObject(array);
}

type ReadonlyDeep<T> = {
	readonly [P in keyof T]: ReadonlyDeep<T[P]>;
};

export function useYObject<U>(data: YMap<U>): ReadonlyDeep<U>;
export function useYObject<U>(data: YArray<U>): ReadonlyArray<U>;
export function useYObject<T extends AbstractType<S>, S>(data: T) {
	const ref = useRef<S | null>(null);
	const getSnapshot = () => {
		const d = data.toJSON();
		if (!Object.is(ref.current, d)) {
			ref.current = d;
		}
		return ref.current;
	};
	return useSyncExternalStore(
		(callback) => {
			data.observeDeep(callback);
			return () => {
				data.unobserveDeep(callback);
			};
		},
		getSnapshot,
		getSnapshot,
	);
}
