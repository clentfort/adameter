'use client';

import type { YjsEpochMode } from '@/lib/yjs-epoch';
import { createContext, useContext, useEffect, useState } from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import { Doc as YjsDoc } from 'yjs';
import {
	logPerformanceEvent,
	setCurrentPerformanceRoom,
	startPerformanceTimer,
} from '@/lib/performance-logging';
import {
	getBaseRoom,
	getEffectiveRoom,
	getEpochFromRoom,
	getRoomModeFromRoom,
	getStoredBaseRoom,
	getYjsEpoch,
	getYjsEpochMode,
	setStoredBaseRoom,
	setYjsEpoch,
	setYjsEpochMode,
} from '@/lib/yjs-epoch';
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
	const [baseRoom, setBaseRoom] = useState<string | undefined>(undefined);
	const [epoch, setEpoch] = useState(0);
	const [mode, setMode] = useState<YjsEpochMode>('production');
	const [isRoomStateLoaded, setIsRoomStateLoaded] = useState(false);
	const { doc } = useContext(yjsContext);
	const room = getEffectiveRoom(baseRoom, epoch, mode);

	useEffect(() => {
		const storedMode = getYjsEpochMode();
		const storedBaseRoom = getStoredBaseRoom();
		const storedEpoch = getYjsEpoch(storedMode);

		setMode(storedMode);
		setEpoch(storedEpoch);

		if (storedBaseRoom) {
			setBaseRoom(storedBaseRoom);
			setCurrentPerformanceRoom(
				getEffectiveRoom(storedBaseRoom, storedEpoch, storedMode),
			);
			logPerformanceEvent('sync.room.restored', {
				metadata: {
					epoch: storedEpoch,
					mode: storedMode,
					room: getEffectiveRoom(storedBaseRoom, storedEpoch, storedMode) ?? '',
				},
			});
		}

		setIsRoomStateLoaded(true);
	}, []);

	useYPartykitSync(room, doc);

	useEffect(() => {
		if (!isRoomStateLoaded) {
			return;
		}

		setCurrentPerformanceRoom(room);
		logPerformanceEvent(
			'sync.room.changed',
			{
				metadata: {
					epoch,
					mode,
					roomBase: baseRoom ?? '',
					room: room ?? '',
				},
			},
			{ throttleKey: 'sync.room.changed', throttleMs: 2000 },
		);

		setYjsEpochMode(mode);
		setYjsEpoch(epoch, mode);
		setStoredBaseRoom(baseRoom, { epoch, mode });
	}, [baseRoom, epoch, isRoomStateLoaded, mode, room]);

	return (
		<DataSynchronizationContext.Provider
			value={{
				room,
				setRoom: (nextRoom) => {
					if (!nextRoom) {
						const currentMode = getYjsEpochMode();
						setMode(currentMode);
						setEpoch(getYjsEpoch(currentMode));
						setBaseRoom(undefined);
						return;
					}

					const parsedEpoch = getEpochFromRoom(nextRoom);
					const parsedMode = getRoomModeFromRoom(nextRoom);
					const nextMode =
						parsedEpoch !== undefined ? parsedMode : getYjsEpochMode();
					const nextEpoch =
						parsedEpoch !== undefined ? parsedEpoch : getYjsEpoch(nextMode);

					setMode(nextMode);
					setEpoch(nextEpoch);
					setBaseRoom(getBaseRoom(nextRoom));
				},
			}}
		>
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

		const provider = new YPartyKitProvider(
			'https://adameter-party.clentfort.partykit.dev',
			room,
			doc,
			{ connect: true },
		);

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
