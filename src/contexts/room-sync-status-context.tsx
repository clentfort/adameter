'use client';

import type { RoomSyncStatus } from '@/lib/tinybase-sync/room-sync';
import { createContext, useContext } from 'react';

/**
 * Status of the background room sync, or undefined when not in a room.
 */
export const RoomSyncStatusContext = createContext<RoomSyncStatus | undefined>(
	undefined,
);

export function useRoomSyncStatus() {
	return useContext(RoomSyncStatusContext);
}
