'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import { Doc as YjsDoc } from 'yjs';
import { yjsContext } from './yjs-context';

interface DataSynchronizationContextProps {
	room: string | undefined;
	setRoom: (room: string | undefined) => void;
}

export const DataSynchronizationContext =
	createContext<DataSynchronizationContextProps>({
		room: undefined,
		setRoom: (_room: string | undefined) => {},
	});

interface DataSynchronizationProviderProps {
	children: React.ReactNode;
}

export function DataSynchronizationProvider({
	children,
}: DataSynchronizationProviderProps) {
	const [room, setRoom] = useState<string | undefined>(undefined);
	const { doc } = useContext(yjsContext);
	useEffect(() => {
		const room = localStorage.getItem('room');
		if (room) {
			setRoom(room);
		}
	}, []);
	useYPartykitSync(room, doc);
	useEffect(() => {
		if (!room) {
			return;
		}
		localStorage.setItem('room', room);
	}, [room]);

	return (
		<DataSynchronizationContext.Provider value={{ room, setRoom }}>
			{children}
		</DataSynchronizationContext.Provider>
	);
}

/**
 * Sets up synchronization of Yjs document via PartyKit
 */
function useYPartykitSync(room: string | undefined, doc: YjsDoc) {
	useEffect(() => {
		if (!room) {
			return;
		}

		const provider = new YPartyKitProvider(
			'https://adameter-party.clentfort.partykit.dev',
			room,
			doc,
			{ connect: true },
		);

		return () => {
			provider.destroy();
		};
	}, [room, doc]);
}
