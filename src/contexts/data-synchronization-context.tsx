'use client';

import { createContext, useEffect, useState } from 'react';

export type JoinStrategy = 'merge' | 'overwrite' | 'clear';

const ROOM_STORAGE_KEY = 'room';
const ROOM_JOIN_STRATEGY_STORAGE_KEY = 'room-join-strategy';

function isJoinStrategy(candidate: string | null): candidate is JoinStrategy {
	return (
		candidate === 'clear' || candidate === 'merge' || candidate === 'overwrite'
	);
}

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
		joinStrategy: 'merge',
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
	const [joinStrategy, setJoinStrategy] = useState<JoinStrategy>('merge');
	const [isHydrated, setIsHydrated] = useState(false);

	const joinRoom = (roomId: string, strategy: JoinStrategy) => {
		setJoinStrategy(strategy);
		setRoom(roomId);
	};

	const leaveRoom = () => {
		setRoom(undefined);
		setJoinStrategy('merge');
	};

	useEffect(() => {
		const restoredRoom = localStorage.getItem(ROOM_STORAGE_KEY);
		const restoredJoinStrategy = localStorage.getItem(
			ROOM_JOIN_STRATEGY_STORAGE_KEY,
		);
		if (restoredRoom) {
			setRoom(restoredRoom);
			if (isJoinStrategy(restoredJoinStrategy)) {
				setJoinStrategy(restoredJoinStrategy);
			} else {
				setJoinStrategy('merge');
			}
		}

		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!isHydrated) {
			return;
		}

		if (!room) {
			localStorage.removeItem(ROOM_STORAGE_KEY);
			localStorage.removeItem(ROOM_JOIN_STRATEGY_STORAGE_KEY);
			return;
		}
		localStorage.setItem(ROOM_STORAGE_KEY, room);
		localStorage.setItem(ROOM_JOIN_STRATEGY_STORAGE_KEY, joinStrategy);
	}, [isHydrated, joinStrategy, room]);

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
