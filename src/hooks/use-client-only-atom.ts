import { useAtom } from 'jotai/react';
import { Atom } from 'jotai/vanilla';
import { useIsMounted } from './use-is-mounted';

export function useClientOnlyAtom<T>(atom: Atom<T>) {
	const useableAtom = useAtom(atom);
	const isMounted = useIsMounted();

	if (!isMounted) {
		return [undefined, (_: T) => {}] as const;
	}

	return useableAtom;
}
