'use client';

import { createContext, useEffect, useState } from 'react';
import {
	logPerformanceEvent,
	setCurrentPerformanceRoom,
} from '@/lib/performance-logging';

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
