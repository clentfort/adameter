import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildRoomInviteUrl,
	parseRoomFromScan,
	ROOM_INVITE_PARAM,
} from './room-invite';

describe('room-invite utility', () => {
	beforeEach(() => {
		vi.stubGlobal('location', new URL('https://example.com/app'));
	});

	describe('ROOM_INVITE_PARAM', () => {
		it('should equal room', () => {
			expect(ROOM_INVITE_PARAM).toBe('room');
		});
	});

	describe('buildRoomInviteUrl', () => {
		it('should build url with default window location', () => {
			const url = buildRoomInviteUrl('my-room-123');
			expect(url).toBe('https://example.com/app?room=my-room-123');
		});

		it('should build url with custom base url', () => {
			const url = buildRoomInviteUrl(
				'my-room-123',
				'https://test.com/share?other=1',
			);
			expect(url).toBe('https://test.com/share?other=1&room=my-room-123');
		});
	});

	describe('parseRoomFromScan', () => {
		it('should return null for empty text', () => {
			expect(parseRoomFromScan('')).toBeNull();
		});

		it('should parse room parameter from a valid URL', () => {
			const text = 'https://example.com/app?room=scanned-room-456';
			expect(parseRoomFromScan(text)).toBe('scanned-room-456');
		});

		it('should return null if valid URL has no room parameter', () => {
			const text = 'https://example.com/app?other=123';
			expect(parseRoomFromScan(text)).toBeNull();
		});

		it('should return raw text if input is not a valid URL', () => {
			const text = 'raw-room-name-789';
			expect(parseRoomFromScan(text)).toBe('raw-room-name-789');
		});
	});
});
