'use client';

import { createContext, useEffect, useState } from 'react';
import * as storage from '@/lib/storage';

export type JoinStrategy = 'merge' | 'overwrite' | 'clear';

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
		const restoredRoom = storage.getItem(storage.STORAGE_KEYS.ROOM);
		const restoredJoinStrategy = storage.getItem(
			storage.STORAGE_KEYS.ROOM_JOIN_STRATEGY,
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
			storage.removeItem(storage.STORAGE_KEYS.ROOM);
			storage.removeItem(storage.STORAGE_KEYS.ROOM_JOIN_STRATEGY);
			return;
		}
		storage.setItem(storage.STORAGE_KEYS.ROOM, room);
		storage.setItem(storage.STORAGE_KEYS.ROOM_JOIN_STRATEGY, joinStrategy);
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
