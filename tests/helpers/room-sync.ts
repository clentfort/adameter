import type { Browser, BrowserContext, Page } from '@playwright/test';
import { enableSkipProfile } from '../fixtures/test';
import { createRoom, joinRoom } from './rooms';

interface RoomSyncSession {
	close: () => Promise<void>;
	contextA: BrowserContext;
	contextB: BrowserContext;
	pageA: Page;
	pageB: Page;
}

export async function createRoomSyncSession(
	browser: Browser,
): Promise<RoomSyncSession> {
	const contextA = await browser.newContext();
	const contextB = await browser.newContext();

	await enableSkipProfile(contextA);
	await enableSkipProfile(contextB);

	const pageA = await contextA.newPage();
	const pageB = await contextB.newPage();

	await pageA.goto('/');
	await pageB.goto('/');

	return {
		close: async () => {
			await contextA.close();
			await contextB.close();
		},
		contextA,
		contextB,
		pageA,
		pageB,
	};
}

export async function createRoomAndJoinPeer({
	pageA,
	pageB,
}: Pick<RoomSyncSession, 'pageA' | 'pageB'>) {
	const roomName = await createRoom(pageA);
	await joinRoom(pageB, roomName);
	return roomName;
}

export async function joinRoomOnBothPages(
	{ pageA, pageB }: Pick<RoomSyncSession, 'pageA' | 'pageB'>,
	roomName: string,
) {
	await joinRoom(pageA, roomName);
	await joinRoom(pageB, roomName);
}
