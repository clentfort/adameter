'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import { Doc as YjsDoc } from 'yjs';
import { PARTYKIT_URL } from '@/lib/partykit-host';
import {
	logPerformanceEvent,
	setCurrentPerformanceRoom,
	startPerformanceTimer,
} from '@/lib/performance-logging';
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
			setCurrentPerformanceRoom(room);
			logPerformanceEvent('sync.room.restored', {
				metadata: { room },
			});
		}
	}, []);
	useYPartykitSync(room, doc);
	useEffect(() => {
		setCurrentPerformanceRoom(room);
		logPerformanceEvent(
			'sync.room.changed',
			{
				metadata: {
					room: room ?? '',
				},
			},
			{ throttleKey: 'sync.room.changed', throttleMs: 2000 },
		);

		if (!room) {
			localStorage.removeItem('room');
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

		const connectTimer = startPerformanceTimer('sync.partykit.connect', {
			room,
		});

		const provider = new YPartyKitProvider(PARTYKIT_URL, room, doc, {
			connect: true,
		});

		connectTimer.end();
		logPerformanceEvent('sync.partykit.provider.created', {
			metadata: { room },
		});

		return () => {
			logPerformanceEvent('sync.partykit.provider.destroyed', {
				metadata: { room },
			});
			provider.destroy();
		};
	}, [room, doc]);
}
