'use client';

import { createContext, useEffect, useState } from 'react';

export type JoinStrategy = 'merge' | 'overwrite' | 'clear';

interface DataSynchronizationContextProps {
	isHydrated: boolean;
	joinRoom: (roomId: string, strategy: JoinStrategy) => void;
	joinStrategy: JoinStrategy;
	leaveRoom: () => void;
	room: string | undefined;
	setRoom: (room: string | undefined) => void;
}

export const DataSynchronizationContext =
	createContext<DataSynchronizationContextProps>({
		isHydrated: false,
		joinRoom: () => {},
		joinStrategy: 'overwrite',
		leaveRoom: () => {},
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
	const [joinStrategy, setJoinStrategy] = useState<JoinStrategy>('overwrite');
	const [isHydrated, setIsHydrated] = useState(false);

	const joinRoom = (roomId: string, strategy: JoinStrategy) => {
		setJoinStrategy(strategy);
		setRoom(roomId);
	};

	const leaveRoom = () => {
		setRoom(undefined);
		setJoinStrategy('overwrite');
	};

	useEffect(() => {
		const restoredRoom = localStorage.getItem('room');
		if (restoredRoom) {
			setRoom(restoredRoom);
		}

		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!isHydrated) {
			return;
		}

		if (!room) {
			localStorage.removeItem('room');
			return;
		}
		localStorage.setItem('room', room);
	}, [isHydrated, room]);

	return (
		<DataSynchronizationContext.Provider
			value={{
				isHydrated,
				joinRoom,
				joinStrategy,
				leaveRoom,
				room,
				setRoom,
			}}
		>
			{children}
		</DataSynchronizationContext.Provider>
	);
}
