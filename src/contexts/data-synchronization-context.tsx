'use client';

import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { getItem, removeItem, setItem, STORAGE_KEYS } from '@/lib/storage';

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
	resetJoinStrategy: () => void;
	room: string | undefined;
	setRoom: (room: string | undefined) => void;
}

export const DataSynchronizationContext =
	createContext<DataSynchronizationContextProps>({
		isHydrated: false,
		joinRoom: () => {},
		joinStrategy: 'merge',
		leaveRoom: () => {},
		resetJoinStrategy: () => {},
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

	const joinRoom = useCallback((roomId: string, strategy: JoinStrategy) => {
		setJoinStrategy(strategy);
		setRoom(roomId);
	}, []);

	const leaveRoom = useCallback(() => {
		setRoom(undefined);
		setJoinStrategy('merge');
	}, []);

	const resetJoinStrategy = useCallback(() => {
		setJoinStrategy('overwrite');
	}, []);

	useEffect(() => {
		const restoredRoom = getItem(STORAGE_KEYS.ROOM);
		const restoredJoinStrategy = getItem(STORAGE_KEYS.ROOM_JOIN_STRATEGY);
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
			removeItem(STORAGE_KEYS.ROOM);
			removeItem(STORAGE_KEYS.ROOM_JOIN_STRATEGY);
			return;
		}
		setItem(STORAGE_KEYS.ROOM, room);
		setItem(STORAGE_KEYS.ROOM_JOIN_STRATEGY, joinStrategy);
	}, [isHydrated, joinStrategy, room]);

	const contextValue = useMemo(
		() => ({
			isHydrated,
			joinRoom,
			joinStrategy,
			leaveRoom,
			resetJoinStrategy,
			room,
			setRoom,
		}),
		[
			isHydrated,
			joinRoom,
			joinStrategy,
			leaveRoom,
			resetJoinStrategy,
			room,
			setRoom,
		],
	);

	return (
		<DataSynchronizationContext.Provider value={contextValue}>
			{children}
		</DataSynchronizationContext.Provider>
	);
}
