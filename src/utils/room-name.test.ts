import { describe, expect, it } from 'vitest';
import { generateRoomName } from './room-name';

describe('generateRoomName', () => {
	it('should generate a 3-word room name', () => {
		const name = generateRoomName();
		expect(name.split('-')).toHaveLength(3);
	});

	it('should generate different names', () => {
		const name1 = generateRoomName();
		const name2 = generateRoomName();
		expect(name1).not.toBe(name2);
	});
});
