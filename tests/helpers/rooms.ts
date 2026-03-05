import type { Page } from '@playwright/test';
import { expect } from '../fixtures/test';

export async function openSharingSettings(page: Page) {
	await page.goto('/settings');
	await page.getByTestId('settings-sharing').click();
}

export async function createRoom(page: Page) {
	await openSharingSettings(page);
	await page.getByRole('tab', { name: /create room|raum erstellen/i }).click();
	await page
		.getByRole('button', { name: /create new room|neuen raum erstellen/i })
		.click();

	const roomName = (
		await page.getByTestId('settings-room-name').textContent()
	)?.trim();
	expect(roomName).toBeTruthy();

	return roomName!;
}

export async function joinRoom(page: Page, roomName: string) {
	await openSharingSettings(page);
	await page.getByRole('tab', { name: /join room|raum beitreten/i }).click();
	await page.getByPlaceholder(/(?:predicate-){2}object/i).fill(roomName);
	await page
		.getByRole('button', { name: /join|beitreten/i })
		.first()
		.click();
	await page
		.getByRole('button', { name: /merge & join|zusammenführen/i })
		.click();
	await expect(page.getByTestId('settings-room-name')).toHaveText(roomName);
}
