export const ROOM_INVITE_PARAM = 'room';

export function buildRoomInviteUrl(
	room: string,
	base: string = window.location.href,
): string {
	const url = new URL(base);
	url.searchParams.set(ROOM_INVITE_PARAM, room);
	return url.toString();
}

export function parseRoomFromScan(text: string): string | null {
	if (!text) {
		return null;
	}

	try {
		const url = new URL(text);
		return url.searchParams.get(ROOM_INVITE_PARAM);
	} catch {
		// Not a URL, fallback to raw text
		return text;
	}
}
