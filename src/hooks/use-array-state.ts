import { useContext } from 'react';
import { useSnapshot } from 'valtio/react';
import { State, yjsContext } from '@/contexts/yjs-context';

export function useArrayState<
	T extends keyof State,
	S extends State[T][number],
>(key: T) {
	const { state } = useContext(yjsContext);
	const snap = useSnapshot(state);
	const add = (item: S) => {
		state[key] = [item, ...(state[key] ?? [])];
	};

	const remove = (itemId: string) => {
		state[key] = (state[key] ?? []).filter((item) => item.id !== itemId);
	};

	const update = (item: S) => {
		state[key] = (state[key] ?? []).map((i) => (i.id === item.id ? item : i));
	};

	return { add, remove, update, value: snap[key] ?? [] } as const;
}
