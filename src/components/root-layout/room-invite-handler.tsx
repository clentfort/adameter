'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { JoinRoomDialog } from './join-room-dialog';
import { LeaveRoomWarningDialog } from './leave-room-warning-dialog';

export function RoomInviteHandler() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { room: currentRoom } = useContext(DataSynchronizationContext);
	const [pendingRoom, setPendingRoom] = useState<string | null>(null);
	const [showWarning, setShowWarning] = useState(false);
	const [showJoin, setShowJoin] = useState(false);

	useEffect(() => {
		const roomFromUrl = searchParams.get('room');
		if (roomFromUrl && roomFromUrl !== currentRoom) {
			setPendingRoom(roomFromUrl);
			if (currentRoom) {
				setShowWarning(true);
			} else {
				setShowJoin(true);
			}
		}
	}, [searchParams, currentRoom]);

	const handleWarningConfirm = () => {
		setShowWarning(false);
		setShowJoin(true);
	};

	const handleCancel = () => {
		setPendingRoom(null);
		setShowWarning(false);
		setShowJoin(false);

		// Clear the URL param
		const url = new URL(window.location.href);
		url.searchParams.delete('room');
		router.replace(url.pathname + url.search);
	};

	const handleJoin = () => {
		setPendingRoom(null);
		setShowWarning(false);
		setShowJoin(false);

		// Clear the URL param
		const url = new URL(window.location.href);
		url.searchParams.delete('room');
		router.replace(url.pathname + url.search);
	};

	return (
		<>
			{showWarning && pendingRoom && (
				<LeaveRoomWarningDialog
					onCancel={handleCancel}
					onConfirm={handleWarningConfirm}
				/>
			)}
			{showJoin && pendingRoom && (
				<JoinRoomDialog
					onCancel={handleCancel}
					onJoin={handleJoin}
					roomId={pendingRoom}
				/>
			)}
		</>
	);
}
