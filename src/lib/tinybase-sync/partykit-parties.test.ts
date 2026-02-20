import { describe, expect, it } from 'vitest';
import {
	isTinybasePartykitParty,
	TINYBASE_PARTYKIT_PARTY,
} from './partykit-parties';

describe('partykit parties', () => {
	it('defines the tinybase party', () => {
		expect(TINYBASE_PARTYKIT_PARTY).toBe('tinybase');
	});

	it('detects tinybase party names correctly', () => {
		expect(isTinybasePartykitParty(TINYBASE_PARTYKIT_PARTY)).toBe(true);
		expect(isTinybasePartykitParty('main')).toBe(false);
		expect(isTinybasePartykitParty('custom-room')).toBe(false);
	});
});
