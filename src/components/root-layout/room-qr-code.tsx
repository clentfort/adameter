'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useMemo } from 'react';
import { buildRoomInviteUrl } from '@/utils/room-invite';

interface RoomQRCodeProps {
	room: string;
}

export function RoomQRCode({ room }: RoomQRCodeProps) {
	const inviteUrl = useMemo(() => {
		if (typeof window === 'undefined') {
			return '';
		}
		return buildRoomInviteUrl(room);
	}, [room]);

	return (
		<div className="flex flex-col items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
			<QRCodeSVG
				height={256}
				includeMargin
				level="M"
				value={inviteUrl}
				width={256}
			/>
			<div className="text-center">
				<p className="text-sm font-medium text-slate-900">Scan to join room</p>
				<p className="text-xs text-slate-500">{room}</p>
			</div>
		</div>
	);
}
