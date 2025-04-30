'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import { AbstractType, Doc } from 'yjs';
import { yjsContext } from './yjs-context';

export const DataSynchronizationContext = createContext(
	(_room: string | undefined) => {},
);

interface DataSynchronizationProviderProps {
	children: React.ReactNode;
}

export function DataSynchronizationProvider({
	children,
}: DataSynchronizationProviderProps) {
	const [room, setRoom] = useState<string | undefined>();
	const { doc } = useContext(yjsContext);
	const [provider, setProvider] = useState<YPartyKitProvider | undefined>();

	useEffect(() => {
		if (!room) {
			return;
		}

		const provider = new YPartyKitProvider('localhost:1999', room, doc, {
			connect: true,
		});

		setProvider(provider);

		return () => {
			setProvider(undefined);
			provider.destroy();
		};
	}, [room, doc]);

	return (
		<DataSynchronizationContext.Provider value={setRoom}>
			{children}
		</DataSynchronizationContext.Provider>
	);
}
