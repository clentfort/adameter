'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { ROOM_INVITE_PARAM } from '@/utils/room-invite';
import { JoinRoomDialog } from './join-room-dialog';
import { LeaveRoomWarningDialog } from './leave-room-warning-dialog';

export function RoomInviteHandler() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { room: currentRoom } = useContext(DataSynchronizationContext);
	const [invite, setInvite] = useState<{
		room: string;
		step: 'warn' | 'join';
	} | null>(null);

	useEffect(() => {
		const roomFromUrl = searchParams.get(ROOM_INVITE_PARAM);
		if (roomFromUrl && roomFromUrl !== currentRoom) {
			setInvite({
				room: roomFromUrl,
				step: currentRoom ? 'warn' : 'join',
			});
		}
	}, [searchParams, currentRoom]);

	const handleWarningConfirm = () => {
		if (invite) {
			setInvite({ ...invite, step: 'join' });
		}
	};

	const dismissInvite = () => {
		setInvite(null);

		// Clear the URL param
		const url = new URL(window.location.href);
		url.searchParams.delete(ROOM_INVITE_PARAM);
		router.replace(url.pathname + url.search);
	};

	return (
		<>
			{invite?.step === 'warn' && (
				<LeaveRoomWarningDialog
					onCancel={dismissInvite}
					onConfirm={handleWarningConfirm}
				/>
			)}
			{invite?.step === 'join' && (
				<JoinRoomDialog
					onCancel={dismissInvite}
					onJoin={dismissInvite}
					roomId={invite.room}
				/>
			)}
		</>
	);
}
