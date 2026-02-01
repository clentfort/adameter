import { describe, it, expect } from 'vitest';
import { generateRoomName } from './room-names';

describe('generateRoomName', () => {
	it('should generate a 3-word combo', () => {
		const name = generateRoomName();
		expect(name.split('-')).toHaveLength(3);
	});

	it('should generate different names', () => {
		const name1 = generateRoomName();
		const name2 = generateRoomName();
		expect(name1).not.toBe(name2);
	});
});
