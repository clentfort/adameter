import { useAtom } from 'jotai/react';
import { PrimitiveAtom } from 'jotai/vanilla';
import { useIsMounted } from './use-is-mounted';

export function useArrayAtom<T extends { id: string }>(
	atom: PrimitiveAtom<T[]>,
) {
	const [value, set] = useAtom(atom);
	const isMounted = useIsMounted();

	if (!isMounted) {
		return {
			add: () => {},
			remove: () => {},
			set: () => {},
			update: () => {},
			value: [],
		};
	}

	const add = (item: T) => {
		set([item, ...value]);
	};

	const remove = (itemId: string) => {
		const next = value.filter((item) => item.id !== itemId);
		set(next);
	};

	const update = (item: T) => {
		const next = value.map((i) => (i.id === item.id ? item : i));
		set(next);
	};

	return { add, remove, set, update, value } as const;
}
